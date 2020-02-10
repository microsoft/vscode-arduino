import * as ccp from "cocopa";
import * as path from "path";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import { VscodeSettings } from "./vscodeSettings";
import { arduinoChannel } from "../common/outputChannel";
import { ArduinoWorkspace } from "../common/workspace";

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
export function makeCompilerParserContext(dc: DeviceContext)
    : { callback: (s: string) => void; conclude: () => void; } {

    const globalDisable = VscodeSettings.getInstance().disableIntelliSenseAutoGen;
    const project = dc.disableIntelliSenseAutoGen;

    if (project !== "disable" && !globalDisable ||
        project === "enable") {

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
                console.log(e);
            }
        };
        return {
            callback: runner.callback(),
            conclude: _conclude,
        }
    }
    return {
        callback: undefined,
        conclude: undefined,
    }
};

/**
 *
 * @param dc
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
