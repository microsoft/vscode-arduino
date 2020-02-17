import * as ccp from "cocopa";
import * as path from "path";

import * as constants from "../common/constants";
import { arduinoChannel } from "../common/outputChannel";
import { ArduinoWorkspace } from "../common/workspace";
import { DeviceContext } from "../deviceContext";

import { VscodeSettings } from "./vscodeSettings";

export interface ICoCoPaContext {
    callback: (s: string) => void;
    conclude: () => void;
};

/**
 * Returns true if the combination of global enable/disable and project
 * specific override enable the auto-generation of the IntelliSense
 * configuration.
 */
export function isCompilerParserEnabled(dc?: DeviceContext) {
    if (!dc) {
        dc = DeviceContext.getInstance();
    }
    const globalDisable = VscodeSettings.getInstance().disableIntelliSenseAutoGen;
    const projectSetting = dc.disableIntelliSenseAutoGen;
    return projectSetting !== "disable" && !globalDisable ||
           projectSetting === "enable";
}

/**
 * Creates a context which is used for compiler command parsing
 * during building (verify, upload, ...).
 *
 * This context makes sure that it can be used in those sections
 * without having to check whether this feature is en- or disabled
 * and keeps the calling context more readable.
 *
 * @param dc The device context of the caller.
 */
export function makeCompilerParserContext(dc: DeviceContext): ICoCoPaContext {

    const engines = makeCompilerParserEngines(dc);
    const runner = new ccp.Runner(engines);

    // set up the function to be called after parsing
    const _conclude = () => {
        if (!runner.result) {
            arduinoChannel.warning("Failed to generate IntelliSense configuration.");
            return;
        }
        const pPath = path.join(ArduinoWorkspace.rootPath, constants.CPP_CONFIG_FILE);
        // TODO: check what kind of result we've got: gcc or other architecture:
        //  and instantiate content accordingly (to be implemented within cocopa)
        const content = new ccp.CCppPropertiesContentResult(runner.result,
                                                            "Arduino",
                                                            ccp.CCppPropertiesISMode.Gcc_X64,
                                                            ccp.CCppPropertiesCStandard.C11,
                                                            // as of 1.8.11 arduino is on C++11
                                                            ccp.CCppPropertiesCppStandard.Cpp11);
        try {
            const prop = new ccp.CCppProperties();
            prop.read(pPath);
            prop.merge(content, ccp.CCppPropertiesMergeMode.ReplaceSameNames);
            if (prop.write(pPath)) {
                arduinoChannel.info("IntelliSense configuration updated.");
            } else {
                arduinoChannel.info("IntelliSense configuration already up to date.");
            }
        } catch (e) {
            // TODO: some debug trace as this shouldn't happen
        }
    };
    return {
        callback: runner.callback(),
        conclude: _conclude,
    }
};

/**
 * Assembles compiler parser engines which then will be used to find the main
 * sketch's compile command and parse the infomation from it required for
 * assembling an IntelliSense configuration from it.
 *
 * It could return multiple engines for different compilers or - if necessary -
 * return specialized engines based on the current board architecture.
 *
 * @param dc Current device context used to generate the engines.
 */
function makeCompilerParserEngines(dc: DeviceContext) {

    let sketch = path.basename(dc.sketch);
    const dotcpp = sketch.endsWith(".ino") ? ".cpp" : "";
    sketch = `-o\\s+\\S*${ccp.regExEscape(sketch)}${dotcpp}\\.o`;

    const matchPattern = [
        // make sure we're running g++
        /(?:^|-)g\+\+\s+/,
        // make sure we're compiling
        /\s+-c\s+/,
        // trigger parser when compiling the main sketch
        RegExp(sketch),
    ];

    const dontMatchPattern = [
        // make sure Arduino's not testing libraries
        /-o\s+\/dev\/null/,
    ];

    // setup the parser with its engines
    const gccParserEngine = new ccp.ParserGcc(matchPattern, dontMatchPattern);
    return [gccParserEngine];
}
