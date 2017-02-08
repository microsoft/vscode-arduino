/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as util from "./common/util";

import { ArduinoApp } from "./arduino/arduino";
import { IBoard } from "./arduino/boardManager";
import { DEVICE_CONFIG_FILE } from "./common/constants";

/**
 * Interface that represents the arduino context information.
 * @interface
 */
export interface IDeviceContext {
    /**
     * COM Port connect to the device
     * @property {string}
     */
    port: string;

    /**
     * Current selected Arduino board alias.
     * @property {string}
     */
    board: string;

    /**
     * Arduino main sketch file
     * @property {string}
     */
    sketch: string;
}

export class DeviceContext implements IDeviceContext, vscode.Disposable {

    public static getIntance(): DeviceContext {
        return DeviceContext._deviceContext;
    }

    private static _deviceContext: DeviceContext = new DeviceContext();

    private _port: string;

    private _board: string;

    private _sketch: string;

    private _arduinoApp: ArduinoApp;

    private _watcher: vscode.FileSystemWatcher;

    /**
     * @constructor
     */
    private constructor() {
        this._watcher = vscode.workspace.createFileSystemWatcher(path.join(vscode.workspace.rootPath, DEVICE_CONFIG_FILE));
        this._watcher.onDidCreate(() => this.loadContext());
        this._watcher.onDidChange(() => this.loadContext());
        this._watcher.onDidDelete(() => this.loadContext());
    }

    public dispose() {
        this._watcher.dispose();
    }

    public get arduinoApp(): ArduinoApp {
        return this._arduinoApp;
    }

    public set arduinoApp(value: ArduinoApp) {
        this._arduinoApp = value;
    }

    /**
     * TODO: Current we use the Arduino default settings. For future release, this dependency might be removed
     * and the setting only depends on device.json.
     * @method
     */
    public loadContext(): Thenable<Object> {
        let preferences = this.arduinoApp.preferences;
        this.sketch = "app/app.ino";
        if (preferences) {
            this._board = preferences.get("board");
            this._port = preferences.get("serial.port");
        }

        return vscode.workspace.findFiles(DEVICE_CONFIG_FILE, null, 1)
            .then((files) => {
                let deviceConfigJson: any = {};
                if (files && files.length > 0) {
                    const configFile = files[0];
                    deviceConfigJson = JSON.parse(fs.readFileSync(configFile.fsPath, "utf8"));
                    this._port = deviceConfigJson.port;
                    this._board = deviceConfigJson.board;
                    this._sketch = deviceConfigJson.sketch;
                }
                return this;
            });
    }

    public saveContext() {
        const deviceConfigFile = path.join(vscode.workspace.rootPath, DEVICE_CONFIG_FILE);
        let deviceConfigJson: any = {};
        if (util.fileExists(deviceConfigFile)) {
            deviceConfigJson = JSON.parse(fs.readFileSync(deviceConfigFile, "utf8"));
        }
        deviceConfigJson.sketch = this.sketch;
        deviceConfigJson.port = this.port;
        deviceConfigJson.board = this.board;

        fs.writeFileSync(path.join(vscode.workspace.rootPath, DEVICE_CONFIG_FILE), JSON.stringify(deviceConfigJson, null, 4));
    }

    public get port() {
        return this._port;
    }

    public set port(value: string) {
        this._port = value;
        this.saveContext();
    }

    public get board() {
        return this._board;
    }

    public set board(value: string) {
        this._board = value;
        this.saveContext();
    }

    public get sketch() {
        return this._sketch;
    }

    public set sketch(value: string) {
        this._sketch = value;
    }
}
