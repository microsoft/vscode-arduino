// Copyright (c) Elektronik Workshop. All rights reserved.
// Licensed under the MIT license.

import * as ccp from "cocopa";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as tp from "typed-promisify";

import * as constants from "../common/constants";
import { arduinoChannel } from "../common/outputChannel";
import { ArduinoWorkspace } from "../common/workspace";
import { DeviceContext } from "../deviceContext";
import { VscodeSettings } from "./vscodeSettings";

export interface ICoCoPaContext {
    callback: (s: string) => void;
    conclude: () => Promise<void>;
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
    const projectSetting = dc.intelliSenseGen;
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
 *
 * Possible enhancements:
 *
 * * Parse c++ standard from arduino command line
 *
 *     Arduino currently sets the C++ standard during compilation with the
 *     flag -std=gnu++11
 *
 * * Order of includes: Perhaps insert the internal includes at the front
 *     as at least for the forcedIncludes IntelliSense seems to take the
 *     order into account.
 */
export function makeCompilerParserContext(dc: DeviceContext): ICoCoPaContext {

    const engines = makeCompilerParserEngines(dc);
    const runner = new ccp.Runner(engines);

    // Set up the callback to be called after parsing
    const _conclude = async () => {
        if (!runner.result) {
            arduinoChannel.warning("Failed to generate IntelliSense configuration.");
            return;
        }

        // Normalize compiler and include paths (resolve ".." and ".")
        runner.result.normalize();

        // Search for Arduino.h in the include paths - we need it for a
        // forced include - users expect Arduino symbols to be available
        // in main sketch without having to include the header explicitly
        const ardHeader = await locateArduinoHeader(runner.result.includes);
        const forcedIncludes = ardHeader
            ? [ ardHeader ]
            : undefined;
        if (!ardHeader) {
            arduinoChannel.warning("Unable to locate \"Arduino.h\" within IntelliSense include paths.");
        }

        // TODO: check what kind of result we've got: gcc or other architecture:
        //  and instantiate content accordingly (to be implemented within cocopa)
        const content = new ccp.CCppPropertiesContentResult(runner.result,
                                                            constants.C_CPP_PROPERTIES_CONFIG_NAME,
                                                            ccp.CCppPropertiesISMode.Gcc_X64,
                                                            ccp.CCppPropertiesCStandard.C11,
                                                            // as of 1.8.11 arduino is on C++11
                                                            ccp.CCppPropertiesCppStandard.Cpp11,
                                                            forcedIncludes);
        try {
            const pPath = path.join(ArduinoWorkspace.rootPath, constants.CPP_CONFIG_FILE);
            const prop = new ccp.CCppProperties();
            prop.read(pPath);
            prop.merge(content, ccp.CCppPropertiesMergeMode.ReplaceSameNames);
            if (prop.write(pPath)) {
                arduinoChannel.info("IntelliSense configuration updated.");
            } else {
                arduinoChannel.info("IntelliSense configuration already up to date.");
            }
        } catch (e) {
            const estr = JSON.stringify(e);
            arduinoChannel.error(`Failed to read or write IntelliSense configuration: ${estr}`);
        }
        const cmd = os.platform() === "darwin"
            ? "Cmd + Alt + I"
            : "Ctrl + Alt + I";
        arduinoChannel.info(`To manually rebuild your IntelliSense configuration run "${cmd}"`);
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
    const sketch = path.basename(dc.sketch);
    const trigger = ccp.getTriggerForArduinoGcc(sketch);
    const gccParserEngine = new ccp.ParserGcc(trigger);
    return [gccParserEngine];
}

/**
 * Search directories recursively for a file.
 * @param dir Directory where the search should begin.
 * @param what The file we're looking for.
 * @returns The path of the directory which contains the file else undefined.
 */
async function findDirContaining(dir: string, what: string): Promise<string | undefined> {
    const readdir = tp.promisify(fs.readdir);
    const fsstat = tp.promisify(fs.stat);

    let entries: string[];
    try {
        entries = await readdir(dir);
    } catch (e) {
        return undefined;
    }
    for (const entry of entries) {
        const p = path.join(dir, entry);
        const s = await fsstat(p);
        if (s.isDirectory()) {
            const result = await findDirContaining(p, what);
            if (result) {
                return result;
            }
        } else if (entry === what) {
            return dir;
        }
    }
    return undefined;
};

/**
 * Tries to find the main Arduino header (i.e. Arduino.h) in the given include
 * paths.
 * @param includes Array containing all include paths in which we should look
 * for Arduino.h
 * @returns The full path of the main Arduino header.
 */
async function locateArduinoHeader(includes: string[]) {
    const header = "Arduino.h";
    for (const i of includes) {
        const result = await findDirContaining(i, header);
        if (result) {
            return path.join(result, header);
        }
    }
    return undefined;
}

/**
 * Possible states of AnalysisManager's state machine.
 */
enum AnalysisState {
    /**
     * No analysis request pending.
     */
    Idle = "idle",
    /**
     * Analysis request pending. Waiting for the time out to expire or for
     * another build to complete.
     */
    Waiting = "waiting",
    /**
     * Analysis in progress.
     */
    Analyzing = "analyzing",
    /**
     * Analysis in progress with yet another analysis request pending.
     * As soon as the current analysis completes the manager will directly
     * enter the Waiting state.
     */
    AnalyzingWaiting = "analyzing and waiting",
}

/**
 * Events (edges) which cause state changes within AnalysisManager.
 */
enum AnalysisEvent {
    /**
     * The only external event. Requests an analysis to be run.
     */
    AnalysisRequest,
    /**
     * The internal wait timeout expired.
     */
    WaitTimeout,
    /**
     * The current analysis build finished.
     */
    AnalysisBuildDone,
}

/**
 * This class manages analysis builds for the automatic IntelliSense
 * configuration synthesis. Its primary purposes are:
 *
 *  * delaying analysis requests caused by DeviceContext setting change
 *      events such that multiple subsequent requests don't cause
 *      multiple analysis builds
 *  * make sure that an analysis request is postponed when another build
 *      is currently in progress
 *
 * TODO: check time of c_cpp_properties.json and compare it with
 * * arduino.json
 * * main sketch file
 * This way we can perhaps optimize this further. But be aware
 * that settings events fire before their corresponding values
 * are actually written to arduino.json -> time of arduino.json
 * is outdated if no countermeasure is taken.
 */
export class AnalysisManager {

    /** The manager's state. */
    private _state: AnalysisState = AnalysisState.Idle;
    /** A callback used by the manager to query if the build backend is busy. */
    private _isBuilding: () => boolean;
    /** A callback used by the manager to initiate an analysis build. */
    private _doBuild: () => Promise<void>;
    /** Timeout for the timeouts/delays in milliseconds. */
    private _waitPeriodMs: number;
    /** The internal timer used to implement the above timeouts and delays. */
    private _timer: NodeJS.Timer;

    /**
     * Constructor.
     * @param isBuilding Provide a callback which returns true if another build
     * is currently in progress.
     * @param doBuild Provide a callback which runs the analysis build.
     * @param waitPeriodMs The delay the manger should wait for potential new
     * analysis request. This delay is used as polling interval as well when
     * checking for ongoing builds.
     */
    constructor(isBuilding: () => boolean,
                doBuild: () => Promise<void>,
                waitPeriodMs: number = 1000) {
        this._isBuilding = isBuilding;
        this._doBuild = doBuild;
        this._waitPeriodMs = waitPeriodMs;
    }

    /**
     * File an analysis request.
     * The analysis will be delayed until no further requests are filed
     * within a wait period or until any build in progress has terminated.
     */
    public async requestAnalysis() {
        await this.update(AnalysisEvent.AnalysisRequest);
    }

    /**
     * Update the manager's state machine.
     * @param event The event which will cause the state transition.
     *
     * Implementation note: asynchronous edge actions must be called after
     * setting the new state since they don't return immediately.
     */
    private async update(event: AnalysisEvent) {

        switch (this._state) {

            case AnalysisState.Idle:
                if (event === AnalysisEvent.AnalysisRequest) {
                    this._state = AnalysisState.Waiting;
                    this.startWaitTimeout();
                }
                break;

            case AnalysisState.Waiting:
                if (event === AnalysisEvent.AnalysisRequest) {
                    // every new request restarts timer
                    this.startWaitTimeout();
                } else if (event === AnalysisEvent.WaitTimeout) {
                    if (this._isBuilding()) {
                        // another build in progress, continue waiting
                        this.startWaitTimeout();
                    } else {
                        // no other build in progress -> launch analysis
                        this._state = AnalysisState.Analyzing;
                        await this.startAnalysis();
                    }
                }
                break;

            case AnalysisState.Analyzing:
                if (event === AnalysisEvent.AnalysisBuildDone) {
                    this._state = AnalysisState.Idle;
                } else if (event === AnalysisEvent.AnalysisRequest) {
                    this._state = AnalysisState.AnalyzingWaiting;
                }
                break;

            case AnalysisState.AnalyzingWaiting:
                if (event === AnalysisEvent.AnalysisBuildDone) {
                    // emulate the transition from idle to waiting
                    // (we don't care if this adds an additional
                    // timeout - event driven analysis is not time-
                    // critical)
                    this._state = AnalysisState.Idle;
                    await this.update(AnalysisEvent.AnalysisRequest);
                }
                break;
        }
    }

    /**
     * Starts the wait timeout timer.
     * If it's already running, the current timer is stopped and restarted.
     * The timeout callback will then update the state machine.
     */
    private startWaitTimeout() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => {
            // reset timer variable first - calling update can cause
            // the timer to be restarted.
            this._timer = undefined;
            this.update(AnalysisEvent.WaitTimeout);
        }, this._waitPeriodMs);
    }

    /**
     * Starts the analysis build.
     * When done, the callback will update the state machine.
     */
    private async startAnalysis() {
        await this._doBuild()
        .then(() => {
            this.update(AnalysisEvent.AnalysisBuildDone);
        })
        .catch((reason) => {
            this.update(AnalysisEvent.AnalysisBuildDone);
        });
    }
}
