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

import { resolveArduinoPath } from "../common/platform";

export interface IArduinoSettings {
    arduinoPath: string;
    additionalUrls: string | string[];
    logLevel: string;
    commandPath: string;
    packagePath: string;
    libPath: string;
}

export class ArduinoSettings implements IArduinoSettings {
    private _arduinoPath: string;

    /**
     * Save the raw arduino path value from the configuration to avoid path resolution.
     */
    private _rawArduinoPathValue: string;

    private _packagePath: string;

    private _libPath: string;

    private _logLevel: string;

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
    }

    public get arduinoPath(): string {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
        const configValue = arduinoConfig.get<string>("path");
        // The configuration is updated
        if (configValue !== this._rawArduinoPathValue) {
            if (configValue === "arduino") {
                this._arduinoPath = resolveArduinoPath();
            } else {
                this._arduinoPath = configValue;
            }
            this._rawArduinoPathValue = configValue;
        }
        return this._arduinoPath;
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
            return path.join(this.arduinoPath, "arduino_debug");
        }
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
                this._packagePath = path.join(process.env.USERPROFILE, "AppData/Local/Arduino15");
            }
            return true;
        });
    }
}
