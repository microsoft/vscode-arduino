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

export const outputChannel = vscode.window.createOutputChannel("Arduino");

/**
 * Represent an Arduino application based on Arduino IDE.
 */
export class ArduinoApp {

    private _preferences: Map<string, string>;

    private _boardManager: BoardManager;
    /**
     * @constructor
     */
    constructor(private _settings: settings.IArduinoSettings) {
    }

    public upload() {

        let dc = DeviceContext.getIntance();

        const boardDescriptor = this.getBoardDescriptorString(dc);
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        outputChannel.show(true);
        return util.spawn(this._settings.commandPath,
            outputChannel,
            ["--upload", "--board", boardDescriptor, "--port", dc.port, appPath]);
    }

    public verify() {
        let dc = DeviceContext.getIntance();
        const boardDescriptor = this.getBoardDescriptorString(dc);
        const appPath = path.join(vscode.workspace.rootPath, dc.sketch);
        outputChannel.show(true);
        return util.spawn(this._settings.commandPath,
            outputChannel,
            ["--verify", "--board", boardDescriptor, "--port", dc.port, appPath]);
    }

    public addLibPath() {
        let dc = DeviceContext.getIntance();

        let paths = this.getPackageLibPaths(dc);
        paths.push(this._settings.libPath);
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

                paths.forEach((libPath) => {
                    libPath = path.resolve(path.normalize(libPath));
                    if (configSection.includePath && configSection.includePath.length) {
                        for (let existingPath of configSection.includePath) {
                            if (libPath === path.resolve(path.normalize(existingPath))) {
                                return;
                            }
                        }
                    } else {
                        configSection.includePath = [];
                    }
                    configSection.includePath.push(libPath);
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
        outputChannel.show(true);
        return util.spawn(this._settings.commandPath,
            outputChannel,
            ["--install-boards", `${packageName}:${arch}`]);
    }

    public uninstallBoard() {

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
        let boardDescriptor = this.boardManager.installedBoards.get(deviceContext.board);
        let boardString = `${boardDescriptor.platform.package.name}:${boardDescriptor.platform.architecture}:${boardDescriptor.board}`;
        return boardString;
    }

    private getPackageLibPaths(dc: IDeviceContext): string[] {
        let boardDescriptor = this._boardManager.installedBoards.get(dc.board);
        let result = [];
        let toolsPath = boardDescriptor.platform.rootBoardPath;
        let coreLibs = fs.readdirSync(path.join(toolsPath, toolsPath, "cores"));
        if (coreLibs && coreLibs.length > 0) {
            coreLibs.forEach((coreLib) => {
                result.push(path.join(toolsPath, toolsPath, "cores", coreLib));
            });
        }

        return result;
    }
}
