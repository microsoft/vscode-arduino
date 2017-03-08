/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as WinReg from "winreg";

import * as constants from "../common/constants";
import * as util from "../common/util";

import { resolveArduinoPath, validateArduinoPath } from "../common/platform";

export interface IArduinoSettings {
    arduinoPath: string;
    additionalUrls: string | string[];
    logLevel: string;
    commandPath: string;
    packagePath: string;
    libPath: string;
    formatterSettings: IClangFormatterSettings;
}

export interface IClangFormatterSettings {
    style: string;
}

export class ArduinoSettings implements IArduinoSettings {
    private _arduinoPath: string;

    private _packagePath: string;

    private _libPath: string;

    private _logLevel: string;

    private _clangFormatterSettings: IClangFormatterSettings;

    public constructor() {
    }

    public async initialize() {
        const platform = os.platform();
        if (platform === "win32") {
            await this.updateWindowsPath(this.arduinoPath);
        } else if (platform === "linux") {
            this._packagePath = path.join(process.env.HOME, ".arduino15");
            this._libPath = path.join(process.env.HOME, "Arduino/libraries");
        } else if (platform === "darwin") {
            this._packagePath = path.join(process.env.HOME, "Library/Arduino15");
            this._libPath = path.join(process.env.HOME, "Documents/Arduino/libraries");
        }
        this.loadClangFormatterSettings();
    }

    public get arduinoPath(): string {
        if (this._arduinoPath) {
            return this._arduinoPath;
        } else {
            // Query arduino path sequentially from the following places such as "vscode user settings", "system environment variables",
            // "usual software installation directory for each os".
            // 1. Search vscode user settings first.
            let arduinoConfig = vscode.workspace.getConfiguration("arduino");
            const configValue = arduinoConfig.get<string>("path");
            if (!configValue || !configValue.trim()) {
                // 2 & 3. Resolve arduino path from system environment varialbes and usual software installation directory.
                this._arduinoPath = resolveArduinoPath();
            } else {
                this._arduinoPath = configValue;
            }

            if (!this._arduinoPath) { // Pop up vscode User Settings page when cannot resolve arduino path.
                vscode.window.showErrorMessage("Cannot find the arduino installation path. Please specify the arduino.path in the User Settings." +
                                               " And restart vscode to apply new settings.");
                vscode.commands.executeCommand("workbench.action.openGlobalSettings");
            } else if (!validateArduinoPath(this._arduinoPath)) { // Validate if arduino path is the correct path.
                vscode.window.showErrorMessage(`Cannot find arduino executable program under "${this._arduinoPath}". Please set the correct ` +
                `arduino.path in the User Settings. And restart vscode to apply new settings.`);
                vscode.commands.executeCommand("workbench.action.openGlobalSettings");
            }
            return this._arduinoPath;
        }
    }

    public get additionalUrls(): string {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
        return arduinoConfig.get<string>("additionalUrls");
    }

    public get packagePath(): string {
        return this._packagePath;
    }

    public get libPath(): string {
        return this._libPath;
    }

    public get logLevel(): string {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
        return arduinoConfig.get<string>("logLevel") || "info";
    }

    public get commandPath(): string {
        const platform = os.platform();
        if (platform === "darwin") {
            return path.join(this.arduinoPath, path.normalize("Arduino.app/Contents/MacOS/Arduino"));
        } else if (platform === "linux") {
            return path.join(this.arduinoPath, "arduino");
        } else if (platform === "win32") {
            return path.join(this.arduinoPath, "arduino_debug.exe");
        }
    }

    public get formatterSettings(): IClangFormatterSettings {
        return this._clangFormatterSettings;
    }

    /**
     * For Windows platform, there are two situations here:
     *  - User change the location of the default *Documents* folder.
     *  - Use the windows store Arduino app.
     */
    private updateWindowsPath(arduinoPath: string): Thenable<boolean> {
        let docFolder = path.join(process.env.USERPROFILE, "Documents");
        return new Promise((resolve, reject) => {
            try {
                const regKey = new WinReg({
                    hive: WinReg.HKCU,
                    key: "\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders",
                });

                regKey.valueExists("Personal", (e, exists) => {
                    if (!e && exists) {
                        regKey.get("Personal", (err, result) => {
                            if (!err && result) {
                                docFolder = result.value;
                            }
                            resolve(docFolder);

                        });
                    }
                    resolve(docFolder);
                });
            } catch (ex) {
                resolve(docFolder);
            }
        }).then((folder: string) => {
            this._libPath = path.join(folder, "Arduino/libraries");
            if (util.fileExistsSync(path.join(arduinoPath, "AppxManifest.xml"))) {
                this._packagePath = path.join(folder, "ArduinoData");
            } else {
                this._packagePath = path.join(process.env.LOCALAPPDATA, "Arduino15");
            }
            return true;
        });
    }

    private loadClangFormatterSettings() {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
        this._clangFormatterSettings = {
            style: arduinoConfig.get<string>("clangFormatStyle"),
        };
    }
}
