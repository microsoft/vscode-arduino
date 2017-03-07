/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import * as constants from "../common/constants";
import * as util from "../common/util";
import * as settings from "./settings";

import { DeviceContext, IDeviceContext } from "../deviceContext";
import { BoardManager } from "./boardManager";

export const arduinoChannel = vscode.window.createOutputChannel("Arduino");

/**
 * Represent an Arduino application based on the official Arduino IDE.
 */
export class ArduinoApp {

    private _preferences: Map<string, string>;

    private _boardManager: BoardManager;

    /**
     * @param {IArduinoSettings} ArduinoSetting object.
     */
    constructor(private _settings: settings.IArduinoSettings) {
    }

    /**
     * Need refresh Arduino IDE's setting when starting up.
     * @param {boolean} force - Whether force initialzie the arduino
     */
    public async initialize(force: boolean = false) {
        if (force || !util.fileExistsSync(path.join(this._settings.packagePath, "package_index.json"))) {
            try {
                // Use the dummy package to initialize the Arduino IDE
                await this.installBoard("dummy", "dummy", "", false);
            } catch (ex) {
            }
        }
    }

    /**
     * Initialize the arduino library.
     */
    public async initializeLibrary() {
        if (!util.fileExistsSync(path.join(this._settings.packagePath, "library_index.json"))) {
            try {
                // Use the dummy library to initialize the Arduino IDE
                await this.installLibrary("dummy", "", false);
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
                ["--pref", `${key}=${value}`]);
        } catch (ex) {
        }
    }

    public upload() {
        let dc = DeviceContext.getIntance();
        const boardDescriptor = this.getBoardDescriptorString(dc);
        if (!boardDescriptor) {
            return;
        }
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        arduinoChannel.show(true);
        const args = ["--upload", "--board", boardDescriptor, "--port", dc.port, appPath];
        if (this._settings.logLevel === "verbose") {
            args.push("--verbose");
        }
        return util.spawn(this._settings.commandPath, arduinoChannel, args);
    }

    public verify() {
        let dc = DeviceContext.getIntance();
        const boardDescriptor = this.getBoardDescriptorString(dc);
        if (!boardDescriptor) {
            return;
        }
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        const args = ["--verify", "--board", boardDescriptor, "--port", dc.port, appPath];
        if (this._settings.logLevel === "verbose") {
            args.push("--verbose");
        }
        arduinoChannel.show(true);
        return util.spawn(this._settings.commandPath, arduinoChannel, args);
    }

    public addLibPath(libraryPath: string) {
        let libPaths;
        if (libraryPath) {
            libPaths = [libraryPath];
        } else {
            libPaths = this.getDefaultPackageLibPaths();
        }

        const configFilePath = path.join(vscode.workspace.rootPath, constants.ARDUINO_CONFIG_FILE);
        let deviceContext = null;
        if (!util.fileExistsSync(configFilePath)) {
            deviceContext = {};
        } else {
            deviceContext = util.tryParseJSON(fs.readFileSync(configFilePath, "utf8"));
        }
        if (!deviceContext) {
            vscode.window.showErrorMessage(constants.messages.ARDUINO_FILE_ERROR);
            throw new Error(constants.messages.ARDUINO_FILE_ERROR);
        }

        deviceContext.configurations = deviceContext.configurations || [];
        let configSection = null;
        deviceContext.configurations.forEach((section) => {
            if (section.name === util.getCppConfigPlatform()) {
                configSection = section;
            }
        });

        if (!configSection) {
            configSection = {
                name: util.getCppConfigPlatform(),
                includePath: [],
            };
            deviceContext.configurations.push(configSection);
        }

        libPaths.forEach((childLibPath) => {
            childLibPath = path.resolve(path.normalize(childLibPath));
            if (configSection.includePath && configSection.includePath.length) {
                for (let existingPath of configSection.includePath) {
                    if (childLibPath === path.resolve(path.normalize(existingPath))) {
                        return;
                    }
                }
            } else {
                configSection.includePath = [];
            }
            configSection.includePath.push(childLibPath);
        });

        fs.writeFileSync(configFilePath, JSON.stringify(deviceContext, null, 4));
    }

    /**
     * Install arduino board package based on package name and platform hardware architecture.
     */
    public installBoard(packageName: string, arch: string, version: string = "", showOutput: boolean = true) {
        arduinoChannel.show(true);
        return util.spawn(this._settings.commandPath,
            showOutput ? arduinoChannel : null,
            ["--install-boards", `${packageName}:${arch}${version && ":" + version}`]);
    }

    public uninstallBoard(packagePath: string) {
        util.rmdirRecursivelySync(packagePath);
    }

    public installLibrary(libName: string, version: string = "", showOutput: boolean = true) {
        arduinoChannel.show(true);
        return util.spawn(this._settings.commandPath,
            showOutput ? arduinoChannel : null,
            ["--install-library", `${libName}${version && ":" + version}`]);
    }

    public uninstallLibrary(libPath: string) {
        util.rmdirRecursivelySync(libPath);
    }

    public getDefaultPackageLibPaths(): string[] {
        let result = [];
        let boardDescriptor = this._boardManager.currentBoard;
        if (!boardDescriptor) {
            return result;
        }
        let toolsPath = boardDescriptor.platform.rootBoardPath;
        if (util.directoryExistsSync(path.join(toolsPath, "cores"))) {
            let coreLibs = fs.readdirSync(path.join(toolsPath, "cores"));
            if (coreLibs && coreLibs.length > 0) {
                coreLibs.forEach((coreLib) => {
                    result.push(path.normalize(path.join(toolsPath, "cores", coreLib)));
                });
            }
        }
        return result;
    }

    public get preferences() {
        if (!this._preferences) {
            this.loadPreferences();
        }
        return this._preferences;
    }

    public get boardManager() {
        return this._boardManager;
    }

    public set boardManager(value: BoardManager) {
        this._boardManager = value;
    }

    private loadPreferences() {
        this._preferences = new Map<string, string>();
        const lineRegex = /(\S+)=(\S+)/;

        const rawText = fs.readFileSync(path.join(this._settings.packagePath, "preferences.txt"), "utf8");
        const lines = rawText.split("\n");
        lines.forEach((line) => {
            if (line) {
                let match = lineRegex.exec(line);
                if (match && match.length > 2) {
                    this._preferences.set(match[1], match[2]);
                }
            }
        });
    }

    private getBoardDescriptorString(deviceContext: IDeviceContext): string {
        let boardDescriptor = this.boardManager.currentBoard;
        if (!boardDescriptor) {
            vscode.window.showErrorMessage(constants.messages.NO_BOARD_SELECTED);
            return;
        }
        let boardString = `${boardDescriptor.platform.package.name}:${boardDescriptor.platform.architecture}:${boardDescriptor.board}`;
        return boardString;
    }
}
