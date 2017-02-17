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
    includePath: string[];
}

export class ArduinoSettings implements IArduinoSettings, vscode.Disposable {
    public static getIntance(): ArduinoSettings {
        return ArduinoSettings._arduinoSettings;
    }

    private static _arduinoSettings: ArduinoSettings = new ArduinoSettings();

    private _watcher: vscode.FileSystemWatcher;

    private _arduinoPath: string;

    /**
     * Save the raw arduino path value from the configuration to avoid path resolution.
     */
    private _rawArduinoPathValue: string;

    private _packagePath: string;

    private _libPath: string;

    private _includePath: string[];

    constructor() {
        this.initializeSettings();
        this._watcher = vscode.workspace.createFileSystemWatcher(path.join(vscode.workspace.rootPath, constants.DEVICE_CONFIG_FILE));
        this._watcher.onDidCreate(() => this.loadIncludePath());
        this._watcher.onDidChange(() => this.loadIncludePath());
        this._watcher.onDidDelete(() => this.loadIncludePath());
    }

    public dispose() {
        this._watcher.dispose();
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

        this.loadIncludePath();
    }

    private loadIncludePath() {
        this._includePath = [];
        if (!fs.existsSync(path.join(vscode.workspace.rootPath, constants.DEVICE_CONFIG_FILE))) {
            return;
        }
        const cppProperties = JSON.parse(fs.readFileSync(path.join(vscode.workspace.rootPath, constants.DEVICE_CONFIG_FILE), "utf8"));
        if (!cppProperties || !cppProperties.configurations) {
            return;
        }
        const plat = util.getCppConfigPlatform();
        cppProperties.configurations.forEach((configSection) => {
            if (configSection.name === plat && Array.isArray(configSection.includePath)) {
                configSection.includePath.forEach((includePath) => {
                    this._includePath.push(includePath);
                });
            }
        });
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
        }
        return path.join(this.arduinoPath, "arduino_debug");
    }

    public set includePath(value: string[]) {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
    }

    public get includePath(): string[] {
        return this._includePath;
    }
}
