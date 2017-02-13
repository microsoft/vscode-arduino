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
     * @constructor
     */
    constructor(private _settings: settings.IArduinoSettings) {
    }

    public async initialize() {
        if (!util.fileExistsSync(path.join(this._settings.packagePath, "package_index.json"))) {
            try {

                // Use the dummy package to initialize the Arduino IDE
                await util.spawn(this._settings.commandPath,
                    null,
                    ["--install-boards", "dummy"]);
            } catch (ex) {
            }
        }
    }

    public async initializeLibrary() {
        if (!util.fileExistsSync(path.join(this._settings.packagePath, "library_index.json"))) {
            try {
                // Use the dummy library to initialize the Arduino IDE
                await util.spawn(this._settings.commandPath,
                    null,
                    ["--install-library", "dummy"]);
            } catch (ex) {
            }
        }
    }

    public upload() {
        let dc = DeviceContext.getIntance();
        const boardDescriptor = this.getBoardDescriptorString(dc);
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        arduinoChannel.show(true);
        return util.spawn(this._settings.commandPath,
            arduinoChannel,
            ["--upload", "--board", boardDescriptor, "--port", dc.port, appPath]);
    }

    public verify() {
        let dc = DeviceContext.getIntance();
        const boardDescriptor = this.getBoardDescriptorString(dc);
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        arduinoChannel.show(true);
        return util.spawn(this._settings.commandPath,
            arduinoChannel,
            ["--verify", "--board", boardDescriptor, "--port", dc.port, appPath]);
    }

    public addLibPath(libraryPath: string) {
        let dc = DeviceContext.getIntance();
        let libPaths;
        if (libraryPath) {
            libPaths = [libraryPath];
        } else {
            libPaths = this.getPackageDefaultLibPaths(dc);
        }

        return vscode.workspace.findFiles(constants.DEVICE_CONFIG_FILE, null, 1)
            .then((files) => {
                let deviceContext = null;
                if (!files || !files.length || files.length < 1) {
                    deviceContext = {};
                } else {
                    const propertyFile = files[0];
                    deviceContext = JSON.parse(fs.readFileSync(propertyFile.fsPath, "utf8"));
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

                fs.writeFileSync(path.join(vscode.workspace.rootPath, constants.DEVICE_CONFIG_FILE), JSON.stringify(deviceContext, null, 4));
            });
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

    /**
     * Install arduino board package based on package name and platform hardware architecture.
     * TODO: Add version
     */
    public installBoard(packageName: string, arch: string) {
        arduinoChannel.show(true);
        return util.spawn(this._settings.commandPath,
            arduinoChannel,
            ["--install-boards", `${packageName}:${arch}`]);
    }

    public uninstallBoard(packagePath: string) {
        util.rmdirRecursivelySync(packagePath);
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
            throw new Error("Please select the board type first.");
        }
        let boardString = `${boardDescriptor.platform.package.name}:${boardDescriptor.platform.architecture}:${boardDescriptor.board}`;
        return boardString;
    }

    private getPackageDefaultLibPaths(dc: IDeviceContext): string[] {
        let boardDescriptor = this._boardManager.currentBoard;
        let result = [];
        let toolsPath = boardDescriptor.platform.rootBoardPath;
        if (util.directoryExistsSync(path.join(toolsPath, "cores"))) {
            let coreLibs = fs.readdirSync(path.join(toolsPath, "cores"));
            if (coreLibs && coreLibs.length > 0) {
                coreLibs.forEach((coreLib) => {
                    result.push(path.join(toolsPath, "cores", coreLib));
                });
            }
        }

        return result;
    }
}
