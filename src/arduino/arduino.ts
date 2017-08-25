// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as glob from "glob";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import * as constants from "../common/constants";
import * as util from "../common/util";
import * as Logger from "../logger/logger";

import { DeviceContext } from "../deviceContext";
import { IArduinoSettings } from "./arduinoSettings";
import { BoardManager } from "./boardManager";
import { ExampleManager } from "./exampleManager";
import { LibraryManager } from "./libraryManager";
import { VscodeSettings } from "./vscodeSettings";

import { arduinoChannel } from "../common/outputChannel";
import { SerialMonitor } from "../serialmonitor/serialMonitor";
import { UsbDetector } from "../serialmonitor/usbDetector";

/**
 * Represent an Arduino application based on the official Arduino IDE.
 */
export class ArduinoApp {

    private _boardManager: BoardManager;

    private _libraryManager: LibraryManager;

    private _exampleManager: ExampleManager;

    /**
     * @param {IArduinoSettings} _settings ArduinoSetting object.
     */
    constructor(private _settings: IArduinoSettings) {
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

    public async upload() {
        const dc = DeviceContext.getInstance();
        const boardDescriptor = this.getBoardBuildString();
        if (!boardDescriptor) {
            return;
        }

        if (!vscode.workspace.rootPath) {
            vscode.window.showWarningMessage("Cannot find the sketch file.");
            return;
        }

        if (!dc.sketch || !util.fileExistsSync(path.join(vscode.workspace.rootPath, dc.sketch))) {
            await this.getMainSketch(dc);
        }
        if (!dc.port) {
            vscode.window.showErrorMessage("Please specify the upload serial port.");
            return;
        }

        arduinoChannel.show();
        arduinoChannel.start(`Upload sketch - ${dc.sketch}`);

        const serialMonitor = SerialMonitor.getInstance();

        const needRestore = await serialMonitor.closeSerialMonitor(dc.port);
        UsbDetector.getInstance().pauseListening();
        await vscode.workspace.saveAll(false);

        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        const args = ["--upload", "--board", boardDescriptor, "--port", dc.port, appPath];
        if (VscodeSettings.getInstance().logLevel === "verbose") {
            args.push("--verbose");
        }
        if (dc.output) {
            const outputPath = path.join(vscode.workspace.rootPath, dc.output);
            args.push("--pref", `build.path=${outputPath}`);
        } else {
            const msg = "Output path is not specified. Unable to reuse previously compiled files. Upload could be slow. See README.";
            arduinoChannel.warning(msg);
        }
        await util.spawn(this._settings.commandPath, arduinoChannel.channel, args).then(async () => {
            UsbDetector.getInstance().resumeListening();
            if (needRestore) {
                await serialMonitor.openSerialMonitor();
            }
            arduinoChannel.end(`Uploaded the sketch: ${dc.sketch}${os.EOL}`);
        }, (reason) => {
            arduinoChannel.error(`Exit with code=${reason.code}${os.EOL}`);
        });
    }

    public async verify(output: string = "") {
        const dc = DeviceContext.getInstance();
        const boardDescriptor = this.getBoardBuildString();
        if (!boardDescriptor) {
            return;
        }

        if (!vscode.workspace.rootPath) {
            vscode.window.showWarningMessage("Cannot find the sketch file.");
            return;
        }

        if (!dc.sketch || !util.fileExistsSync(path.join(vscode.workspace.rootPath, dc.sketch))) {
            await this.getMainSketch(dc);
        }

        await vscode.workspace.saveAll(false);

        arduinoChannel.start(`Verify sketch - ${dc.sketch}`);
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        const args = ["--verify", "--board", boardDescriptor, appPath];
        if (VscodeSettings.getInstance().logLevel === "verbose") {
            args.push("--verbose");
        }
        if (output || dc.output) {
            const outputPath = path.join(vscode.workspace.rootPath, output || dc.output);
            args.push("--pref", `build.path=${outputPath}`);
        } else {
            const msg = "Output path is not specified. Unable to reuse previously compiled files. Verify could be slow. See README.";
            arduinoChannel.warning(msg);
        }

        arduinoChannel.show();
        // we need to return the result of verify
        try {
            await util.spawn(this._settings.commandPath, arduinoChannel.channel, args);
            arduinoChannel.end(`Finished verify sketch - ${dc.sketch}${os.EOL}`);
            return true;
        } catch (reason) {
            arduinoChannel.error(`Exit with code=${reason.code}${os.EOL}`);
            return false;
        }

    }

    // Add selected library path to the intellisense search path.
    public addLibPath(libraryPath: string) {
        let libPaths;
        if (libraryPath) {
            libPaths = [libraryPath];
        } else {
            libPaths = this.getDefaultPackageLibPaths();
        }
        if (!vscode.workspace.rootPath) {
            return;
        }
        const configFilePath = path.join(vscode.workspace.rootPath, constants.CPP_CONFIG_FILE);
        let deviceContext = null;
        if (!util.fileExistsSync(configFilePath)) {
            util.mkdirRecursivelySync(path.dirname(configFilePath));
            deviceContext = {};
        } else {
            deviceContext = util.tryParseJSON(fs.readFileSync(configFilePath, "utf8"));
        }
        if (!deviceContext) {
            Logger.notifyAndThrowUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
        }

        deviceContext.configurations = deviceContext.configurations || [];
        let configSection = null;
        deviceContext.configurations.forEach((section) => {
            if (section.name === util.getCppConfigPlatform()) {
                configSection = section;
                configSection.browse = configSection.browse || {};
                configSection.browse.limitSymbolsToIncludedHeaders = false;
            }
        });

        if (!configSection) {
            configSection = {
                name: util.getCppConfigPlatform(),
                includePath: [],
                browse: { limitSymbolsToIncludedHeaders: false },
            };
            deviceContext.configurations.push(configSection);
        }

        libPaths.forEach((childLibPath) => {
            childLibPath = path.resolve(path.normalize(childLibPath));
            if (configSection.includePath && configSection.includePath.length) {
                for (const existingPath of configSection.includePath) {
                    if (childLibPath === path.resolve(path.normalize(existingPath))) {
                        return;
                    }
                }
            } else {
                configSection.includePath = [];
            }
            configSection.includePath.push(childLibPath);
        });

        libPaths.forEach((childLibPath) => {
            childLibPath = path.resolve(path.normalize(childLibPath));
            if (configSection.browse.path && configSection.browse.path.length) {
                for (const existingPath of configSection.browse.path) {
                    if (childLibPath === path.resolve(path.normalize(existingPath))) {
                        return;
                    }
                }
            } else {
                configSection.browse.path = [];
            }
            configSection.browse.path.push(childLibPath);
        });

        fs.writeFileSync(configFilePath, JSON.stringify(deviceContext, null, 4));
    }

    // Include the *.h header files from selected library to the arduino sketch.
    public async includeLibrary(libraryPath: string) {
        if (!vscode.workspace.rootPath) {
            return;
        }
        const dc = DeviceContext.getInstance();
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
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
            arduinoChannel.start(`Install package - ${packageName}...`);
        }
        try {
            await util.spawn(this._settings.commandPath,
                showOutput ? arduinoChannel.channel : null,
                ["--install-boards", `${packageName}${arch && ":" + arch}${version && ":" + version}`]);

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
                showOutput ? arduinoChannel.channel : null,
                ["--install-library", `${libName}${version && ":" + version}`]);

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

    public getDefaultPackageLibPaths(): string[] {
        const result = [];
        const boardDescriptor = this._boardManager.currentBoard;
        if (!boardDescriptor) {
            return result;
        }
        const toolsPath = boardDescriptor.platform.rootBoardPath;
        if (util.directoryExistsSync(path.join(toolsPath, "cores"))) {
            const coreLibs = fs.readdirSync(path.join(toolsPath, "cores"));
            if (coreLibs && coreLibs.length > 0) {
                coreLibs.forEach((coreLib) => {
                    result.push(path.normalize(path.join(toolsPath, "cores", coreLib)));
                });
            }
        }
        return result;
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
                    port: dc.port || "COM1",
                    board: dc.board,
                    configuration: dc.configuration,
                };
                const arduinoConfigFilePath = path.join(destExample, constants.ARDUINO_CONFIG_FILE);
                util.mkdirRecursivelySync(path.dirname(arduinoConfigFilePath));
                fs.writeFileSync(arduinoConfigFilePath, JSON.stringify(arduinoJson, null, 4));

                // Generate cpptools intellisense config
                const cppConfigFilePath = path.join(destExample, constants.CPP_CONFIG_FILE);
                const cppConfig = {
                    configurations: [{
                        name: util.getCppConfigPlatform(),
                        includePath: this.getDefaultPackageLibPaths(),
                        browse: {
                            limitSymbolsToIncludedHeaders: false,
                        },
                    }],
                };
                util.mkdirRecursivelySync(path.dirname(cppConfigFilePath));
                fs.writeFileSync(cppConfigFilePath, JSON.stringify(cppConfig, null, 4));
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

    private getBoardBuildString(): string {
        const selectedBoard = this.boardManager.currentBoard;
        if (!selectedBoard) {
            Logger.notifyUserError("getBoardBuildString", new Error(constants.messages.NO_BOARD_SELECTED));
            return;
        }
        return selectedBoard.getBuildConfig();
    }

    private async getMainSketch(dc: DeviceContext) {
        await dc.resolveMainSketch();
        if (!dc.sketch) {
            vscode.window.showErrorMessage("No sketch file was found. Please specify the sketch in the arduino.json file");
            throw new Error("No sketch file was found.");
        }
    }
}
