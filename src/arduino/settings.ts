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

import { resolveArduinoPath } from "../common/platform";

export interface IArduinoSettings {
    arduinoPath: string;
    additionalUrls: string | string[];
    commandPath: string;
    packagePath: string;
    libPath: string;
}

export class ArduinoSettings implements IArduinoSettings, vscode.Disposable {
    public static getIntance(): ArduinoSettings {
        return ArduinoSettings._arduinoSettings;
    }

    private static _arduinoSettings: ArduinoSettings = new ArduinoSettings();

    private _arduinoPath: string;

    /**
     * Save the raw arduino path value from the configuration to avoid path resolution.
     */
    private _rawArduinoPathValue: string;

    private _packagePath: string;

    private _libPath: string;

    constructor() {
        this.initializeSettings();
    }

    public dispose() {
    }

    private initializeSettings() {
        const platform = os.platform();
        if (platform === "win32") {
            this._packagePath = path.join(process.env.USERPROFILE, "AppData/Local/Arduino15");
            this._libPath = path.join(process.env.USERPROFILE, "Documents/Arduino/libraries");
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
}
