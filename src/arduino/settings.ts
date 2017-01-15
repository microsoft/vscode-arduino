/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import os = require("os");
import path = require("path");
import vscode = require("vscode");
import util = require("../common/util");

export interface IArduinoSettings {
    arduinoPath: string;
    commandPath: string;
    packagePath: string;
    libPath: string;
}

export class ArduinoSettings implements IArduinoSettings {
    public static getIntance(): ArduinoSettings {
        return ArduinoSettings._arduinoSettings;
    }

    private static _arduinoSettings: ArduinoSettings = new ArduinoSettings();

    private _arduinoPath: string;

    private _packagePath: string;

    private _libPath: string;

    constructor() {
        this.initializeSettings();
    }

    private initializeSettings() {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
        this.arduinoPath = arduinoConfig.get<string>("path");

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
        return this._arduinoPath;
    }

    public get packagePath(): string {
        return this._packagePath;
    }

    public get libPath(): string {
        return this._libPath;
    }

    public get commandPath(): string {
        return path.join(this._arduinoPath, "arduino_debug");
    }

    public set arduinoPath(value: string) {
        this._arduinoPath = value;
    }
}
