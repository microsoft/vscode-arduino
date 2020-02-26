// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as glob from "glob";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import * as constants from "../common/constants";
import * as util from "../common/util";
import * as logger from "../logger/logger";

import { DeviceContext } from "../deviceContext";
import { IArduinoSettings } from "./arduinoSettings";
import { BoardManager } from "./boardManager";
import { ExampleManager } from "./exampleManager";
import { AnalysisManager,
         ICoCoPaContext,
         isCompilerParserEnabled,
         makeCompilerParserContext } from "./intellisense";
import { LibraryManager } from "./libraryManager";
import { ProgrammerManager } from "./programmerManager";
import { VscodeSettings } from "./vscodeSettings";

import { arduinoChannel } from "../common/outputChannel";
import { ArduinoWorkspace } from "../common/workspace";
import { SerialMonitor } from "../serialmonitor/serialMonitor";
import { UsbDetector } from "../serialmonitor/usbDetector";

/**
 * Supported build modes. For further explanation see the documentation
 * of ArduinoApp.build().
 * The strings are used for status reporting within the above function.
 */
export enum BuildMode {
    Verify = "Verifying",
    Analyze = "Analyzing",
    Upload = "Uploading",
    UploadProgrammer = "Uploading (programmer)",
};

/**
 * Represent an Arduino application based on the official Arduino IDE.
 */
export class ArduinoApp {

    private _boardManager: BoardManager;

    private _libraryManager: LibraryManager;

    private _exampleManager: ExampleManager;

    private _programmerManager: ProgrammerManager;

    /**
     * IntelliSense analysis manager.
     * Makes sure that analysis builds and regular builds go along
     * and that multiple subsequent analysis requests - as triggered
     * by board/board-configuration changes - are bundled to a single
     * analysis build run.
     */
    private _analysisManager: AnalysisManager;

    /**
     * Indicates if a build is currently in progress.
     * If so any call to this.build() will return false immediately.
     */
    private _building: boolean = false;

    /**
     * @param {IArduinoSettings} _settings ArduinoSetting object.
     */
    constructor(private _settings: IArduinoSettings) {
        const analysisDelayMs = 1000 * 3;
        this._analysisManager = new AnalysisManager(
            () => this._building,
            async () => { await this.build(BuildMode.Analyze); },
            analysisDelayMs);
    }

    /**
     * Need refresh Arduino IDE's setting when starting up.
     * @param {boolean} force - Whether force initialize the arduino
     */
    public async initialize(force: boolean = false) {
        if (!util.fileExistsSync(this._settings.preferencePath)) {
            try {
                // Use empty pref value to initialize preference.txt file
                await this.setPref("boardsmanager.additional.urls", "");
                this._settings.reloadPreferences(); // reload preferences.
            } catch (ex) {
            }
        }
        if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "package_index.json"))) {
            try {
                // Use the dummy package to initialize the Arduino IDE
                await this.installBoard("dummy", "", "", true);
            } catch (ex) {
            }
        }

        // set up event handling for IntelliSense analysis
        const requestAnalysis = async () => {
            if (isCompilerParserEnabled()) {
                await this._analysisManager.requestAnalysis();
            }
        };
        const dc = DeviceContext.getInstance();
        dc.onChangeBoard(requestAnalysis);
        dc.onChangeConfiguration(requestAnalysis);
        dc.onChangeSketch(requestAnalysis);
    }

    /**
     * Initialize the arduino library.
     * @param {boolean} force - Whether force refresh library index file
     */
    public async initializeLibrary(force: boolean = false) {
        if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "library_index.json"))) {
            try {
                // Use the dummy library to initialize the Arduino IDE
                await this.installLibrary("dummy", "", true);
            } catch (ex) {
            }
        }
    }

    /**
     * Set the Arduino preferences value.
     * @param {string} key - The preference key
     * @param {string} value - The preference value
     */
    public async setPref(key, value) {
        try {
            await util.spawn(this._settings.commandPath,
                null,
                ["--pref", `${key}=${value}`, "--save-prefs"]);
        } catch (ex) {
        }
    }

    /**
     * Returns true if a build is currently in progress.
     */
    public get building() {
        return this._building;
    }

    /**
     * Runs the arduino builder to build/compile and - if necessary - upload
     * the current sketch.
     * @param mode Build mode.
     *  * BuildMode.Upload: Compile and upload
     *  * BuildMode.UploadProgrammer: Compile and upload using the user
     *     selectable programmer
     *  * BuildMode.Analyze: Compile, analyze the output and generate
     *     IntelliSense configuration from it.
     *  * BuildMode.Verify: Just compile.
     * All build modes except for BuildMode.Analyze run interactively, i.e. if
     * something is missing, it tries to query the user for the missing piece
     * of information (sketch, board, etc.). Analyze runs non interactively and
     * just returns false.
     * @param buildDir Override the build directory set by the project settings
     * with the given directory.
     * @returns true on success, false if
     *  * another build is currently in progress
     *  * board- or programmer-manager aren't initialized yet
     *  * or something went wrong during the build
     */
    public async build(mode: BuildMode, buildDir?: string) {

        if (!this._boardManager || !this._programmerManager || this._building) {
            return false;
        }

        this._building = true;

        return await this._build(mode, buildDir)
        .then((ret) => {
            this._building = false;
            return ret;
        })
        .catch((reason) => {
            this._building = false;
            // TODO EW, 2020-02-19: Report unhandled error (Logger?)
            return false;
        });
    }

    // Include the *.h header files from selected library to the arduino sketch.
    public async includeLibrary(libraryPath: string) {
        if (!ArduinoWorkspace.rootPath) {
            return;
        }
        const dc = DeviceContext.getInstance();
        const appPath = path.join(ArduinoWorkspace.rootPath, dc.sketch);
        if (util.fileExistsSync(appPath)) {
            const hFiles = glob.sync(`${libraryPath}/*.h`, {
                nodir: true,
                matchBase: true,
            });
            const hIncludes = hFiles.map((hFile) => {
                return `#include <${path.basename(hFile)}>`;
            }).join(os.EOL);

            // Open the sketch and bring up it to current visible view.
            const textDocument = await vscode.workspace.openTextDocument(appPath);
            await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One, true);
            const activeEditor = vscode.window.visibleTextEditors.find((textEditor) => {
                return path.resolve(textEditor.document.fileName) === path.resolve(appPath);
            });
            if (activeEditor) {
                // Insert *.h at the beginning of the sketch code.
                await activeEditor.edit((editBuilder) => {
                    editBuilder.insert(new vscode.Position(0, 0), `${hIncludes}${os.EOL}${os.EOL}`);
                });
            }
        }
    }

    /**
     * Install arduino board package based on package name and platform hardware architecture.
     */
    public async installBoard(packageName: string, arch: string = "", version: string = "", showOutput: boolean = true) {
        arduinoChannel.show();
        const updatingIndex = packageName === "dummy" && !arch && !version;
        if (updatingIndex) {
            arduinoChannel.start(`Update package index files...`);
        } else {
            try {
                const packagePath = path.join(this._settings.packagePath, "packages", packageName);
                if (util.directoryExistsSync(packagePath)) {
                    util.rmdirRecursivelySync(packagePath);
                }
                arduinoChannel.start(`Install package - ${packageName}...`);
            } catch (error) {
                arduinoChannel.start(`Install package - ${packageName} failed under directory : ${error.path}${os.EOL}
Please make sure the folder is not occupied by other procedures .`);
                arduinoChannel.error(`Error message - ${error.message}${os.EOL}`);
                arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
                return;
            }
        }
        try {
            await util.spawn(this._settings.commandPath,
                             ["--install-boards", `${packageName}${arch && ":" + arch}${version && ":" + version}`],
                             undefined,
                             { channel: showOutput ? arduinoChannel.channel : null });
            if (updatingIndex) {
                arduinoChannel.end("Updated package index files.");
            } else {
                arduinoChannel.end(`Installed board package - ${packageName}${os.EOL}`);
            }
        } catch (error) {
            // If a platform with the same version is already installed, nothing is installed and program exits with exit code 1
            if (error.code === 1) {
                if (updatingIndex) {
                    arduinoChannel.end("Updated package index files.");
                } else {
                    arduinoChannel.end(`Installed board package - ${packageName}${os.EOL}`);
                }
            } else {
                arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
            }
        }
    }

    public uninstallBoard(boardName: string, packagePath: string) {
        arduinoChannel.start(`Uninstall board package - ${boardName}...`);
        util.rmdirRecursivelySync(packagePath);
        arduinoChannel.end(`Uninstalled board package - ${boardName}${os.EOL}`);
    }

    public async installLibrary(libName: string, version: string = "", showOutput: boolean = true) {
        arduinoChannel.show();
        const updatingIndex = (libName === "dummy" && !version);
        if (updatingIndex) {
            arduinoChannel.start("Update library index files...");
        } else {
            arduinoChannel.start(`Install library - ${libName}`);
        }
        try {
            await util.spawn(this._settings.commandPath,
                             ["--install-library", `${libName}${version && ":" + version}`],
                             undefined,
                             { channel: showOutput ? arduinoChannel.channel : undefined });
            if (updatingIndex) {
                arduinoChannel.end("Updated library index files.");
            } else {
                arduinoChannel.end(`Installed library - ${libName}${os.EOL}`);
            }
        } catch (error) {
            // If a library with the same version is already installed, nothing is installed and program exits with exit code 1
            if (error.code === 1) {
                if (updatingIndex) {
                    arduinoChannel.end("Updated library index files.");
                } else {
                    arduinoChannel.end(`Installed library - ${libName}${os.EOL}`);
                }
            } else {
                arduinoChannel.error(`Exit with code=${error.code}${os.EOL}`);
            }
        }
    }

    public uninstallLibrary(libName: string, libPath: string) {
        arduinoChannel.start(`Remove library - ${libName}`);
        util.rmdirRecursivelySync(libPath);
        arduinoChannel.end(`Removed library - ${libName}${os.EOL}`);
    }

    public openExample(example) {
        function tmpName(name) {
            let counter = 0;
            let candidateName = name;
            while (true) {
                if (!util.fileExistsSync(candidateName) && !util.directoryExistsSync(candidateName)) {
                    return candidateName;
                }
                counter++;
                candidateName = `${name}_${counter}`;
            }
        }

        // Step 1: Copy the example project to a temporary directory.
        const sketchPath = path.join(this._settings.sketchbookPath, "generated_examples");
        if (!util.directoryExistsSync(sketchPath)) {
            util.mkdirRecursivelySync(sketchPath);
        }
        let destExample = "";
        if (util.directoryExistsSync(example)) {
            destExample = tmpName(path.join(sketchPath, path.basename(example)));
            util.cp(example, destExample);
        } else if (util.fileExistsSync(example)) {
            const exampleName = path.basename(example, path.extname(example));
            destExample = tmpName(path.join(sketchPath, exampleName));
            util.mkdirRecursivelySync(destExample);
            util.cp(example, path.join(destExample, path.basename(example)));
        }
        if (destExample) {
            // Step 2: Scaffold the example project to an arduino project.
            const items = fs.readdirSync(destExample);
            const sketchFile = items.find((item) => {
                return util.isArduinoFile(path.join(destExample, item));
            });
            if (sketchFile) {
                // Generate arduino.json
                const dc = DeviceContext.getInstance();
                const arduinoJson = {
                    sketch: sketchFile,
                    // TODO EW, 2020-02-18: COM1 is Windows specific - what about OSX and Linux users?
                    port: dc.port || "COM1",
                    board: dc.board,
                    configuration: dc.configuration,
                };
                const arduinoConfigFilePath = path.join(destExample, constants.ARDUINO_CONFIG_FILE);
                util.mkdirRecursivelySync(path.dirname(arduinoConfigFilePath));
                fs.writeFileSync(arduinoConfigFilePath, JSON.stringify(arduinoJson, null, 4));
            }

            // Step 3: Open the arduino project at a new vscode window.
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(destExample), true);
        }
        return destExample;
    }

    public get settings() {
        return this._settings;
    }

    public get boardManager() {
        return this._boardManager;
    }

    public set boardManager(value: BoardManager) {
        this._boardManager = value;
    }

    public get libraryManager() {
        return this._libraryManager;
    }

    public set libraryManager(value: LibraryManager) {
        this._libraryManager = value;
    }

    public get exampleManager() {
        return this._exampleManager;
    }

    public set exampleManager(value: ExampleManager) {
        this._exampleManager = value;
    }

    public get programmerManager() {
        return this._programmerManager;
    }

    public set programmerManager(value: ProgrammerManager) {
        this._programmerManager = value;
    }

    /**
     * Runs the pre build command.
     * Usually before one of
     *  * verify
     *  * upload
     *  * upload using programmer
     * @param dc Device context prepared during one of the above actions
     * @returns True if successful, false on error.
     */
    protected async runPreBuildCommand(dc: DeviceContext): Promise<boolean> {
        const prebuildcmdline = dc.prebuild;
        if (prebuildcmdline) {
            arduinoChannel.info(`Running pre-build command: ${prebuildcmdline}`);
            const args = prebuildcmdline.split(/\s+/);
            const cmd = args.shift();
            try {
                await util.spawn(cmd,
                                 args,
                                 { shell: true, cwd: ArduinoWorkspace.rootPath },
                                 { channel: arduinoChannel.channel });
            } catch (ex) {
                arduinoChannel.error(`Running pre-build command failed: ${os.EOL}${ex.error}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Private implementation. Not to be called directly. The wrapper build()
     * manages the build state.
     * @param mode See build()
     * @param buildDir See build()
     */
    private async _build(mode: BuildMode, buildDir?: string): Promise<boolean> {
        const dc = DeviceContext.getInstance();
        const args: string[] = [];
        let restoreSerialMonitor: boolean = false;
        let cocopa: ICoCoPaContext;

        if (!this.boardManager.currentBoard) {
            if (mode !== BuildMode.Analyze) {
                logger.notifyUserError("getBoardBuildString", new Error(constants.messages.NO_BOARD_SELECTED));
            }
            return false;
        }
        const boardDescriptor = this.boardManager.currentBoard.getBuildConfig();

        args.push("--board", boardDescriptor);

        if (!ArduinoWorkspace.rootPath) {
            vscode.window.showWarningMessage("Workspace doesn't seem to have a folder added to it yet.");
            return false;
        }

        if (!dc.sketch || !util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, dc.sketch))) {
            if (mode === BuildMode.Analyze) {
                // Analyze runs non interactively
                return false;
            }
            if (!await dc.resolveMainSketch()) {
                vscode.window.showErrorMessage("No sketch file was found. Please specify the sketch in the arduino.json file");
                return false;
            }
        }

        const selectSerial = async () => {
            const choice = await vscode.window.showInformationMessage(
                "Serial port is not specified. Do you want to select a serial port for uploading?",
                "Yes", "No");
            if (choice === "Yes") {
                vscode.commands.executeCommand("arduino.selectSerialPort");
            }
        }

        if (mode === BuildMode.Upload) {
            if ((!dc.configuration || !/upload_method=[^=,]*st[^,]*link/i.test(dc.configuration)) && !dc.port) {
                await selectSerial();
                return false;
            }
            args.push("--upload");
            if (dc.port) {
                args.push("--port", dc.port);
            }
        } else if (mode === BuildMode.UploadProgrammer) {
            const programmer = this.programmerManager.currentProgrammer;
            if (!programmer) {
                logger.notifyUserError("getProgrammerString", new Error(constants.messages.NO_PROGRAMMMER_SELECTED));
                return false;
            }
            if (!dc.port) {
                await selectSerial();
                return false;
            }
            args.push("--upload",
                      "--port", dc.port,
                      "--useprogrammer",
                      "--pref", "programmer=" + programmer);

        } else if (mode === BuildMode.Analyze) {
            cocopa = makeCompilerParserContext(dc);
            args.push("--verify", "--verbose");
        } else {
            args.push("--verify");
        }

        const verbose = VscodeSettings.getInstance().logLevel === "verbose";
        if (mode !== BuildMode.Analyze && verbose) {
            args.push("--verbose");
        }

        await vscode.workspace.saveAll(false);

        // we prepare the channel here since all following code will
        // or at leas can possibly output to it
        arduinoChannel.show();
        arduinoChannel.start(`${mode} sketch '${dc.sketch}'`);

        if (!await this.runPreBuildCommand(dc)) {
            return false;
        }

        if (buildDir || dc.output) {
            const outputPath = path.resolve(ArduinoWorkspace.rootPath, buildDir || dc.output);
            const dirPath = path.dirname(outputPath);
            if (!util.directoryExistsSync(dirPath)) {
                logger.notifyUserError("InvalidOutPutPath", new Error(constants.messages.INVALID_OUTPUT_PATH + outputPath));
                return false;
            }

            args.push("--pref", `build.path=${outputPath}`);
            arduinoChannel.info(`Please see the build logs in output path: ${outputPath}`);
        } else {
            const msg = "Output path is not specified. Unable to reuse previously compiled files. Build will be slower. See README.";
            arduinoChannel.warning(msg);
        }

        // stop serial monitor when everything is prepared and good
        // what makes restoring of its previous state easier
        if (mode === BuildMode.Upload || mode === BuildMode.UploadProgrammer) {
            restoreSerialMonitor = await SerialMonitor.getInstance().closeSerialMonitor(dc.port);
            UsbDetector.getInstance().pauseListening();
        }

        // Push sketch as last argument
        args.push(path.join(ArduinoWorkspace.rootPath, dc.sketch));

        const cleanup = async () => {
            if (cocopa) {
                await cocopa.conclude();
            }
            if (mode === BuildMode.Upload || mode === BuildMode.UploadProgrammer) {
                UsbDetector.getInstance().resumeListening();
                if (restoreSerialMonitor) {
                    await SerialMonitor.getInstance().openSerialMonitor();
                }
            }
        }

        return await util.spawn(
            this._settings.commandPath,
            args,
            undefined,
            {
                channel: !cocopa || cocopa && verbose ? arduinoChannel.channel : undefined,
                stdout: cocopa ? cocopa.callback : undefined,
            }
        ).then(async () => {
            await cleanup();
            if (mode !== BuildMode.Analyze) {
                const cmd = os.platform() === "darwin"
                    ? "Cmd + Alt + I"
                    : "Ctrl + Alt + I";
                arduinoChannel.info(`To rebuild your IntelliSense configuration run "${cmd}"`);
            }
            arduinoChannel.end(`${mode} sketch '${dc.sketch}${os.EOL}`);
            return true;
        }, async (reason) => {
            await cleanup();
            const msg = reason.code
                ? `Exit with code=${reason.code}`
                : JSON.stringify(reason);
            arduinoChannel.error(`${mode} sketch '${dc.sketch}': ${msg}${os.EOL}`);
            return false;
        });
    }
}
