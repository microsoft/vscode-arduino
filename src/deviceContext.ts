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

export class DeviceContext implements IDeviceContext {
    public static getIntance(): DeviceContext {
        return DeviceContext._deviceContext;
    }

    private static _deviceContext: DeviceContext = new DeviceContext();

    private _port: string;

    private _board: string;

    private _sketch: string;

    /**
     * @constructor
     */
    private constructor() {
    }

    /**
     * TODO: Current we use the Arduino default settings. For future release, this dependency might be removed
     * and the setting only depends on device.json.
     * @method
     */
    public loadContext(app: ArduinoApp): Thenable<Object> {
        let preferences = app.preferences;
        this.sketch = "app/app.ino";
        if (preferences) {
            this.board = preferences.get("board");
            this.port = preferences.get("serial.port");
        }

        return vscode.workspace.findFiles(DEVICE_CONFIG_FILE, null, 1)
            .then((files) => {
                let deviceConfig: any = {};
                if (files && files.length > 0) {
                    const configFile = files[0];
                    deviceConfig = JSON.parse(fs.readFileSync(configFile.fsPath, "utf8"));
                    this.port = deviceConfig.port;
                    this.board = deviceConfig.board;
                    this.sketch = deviceConfig.sketch;
                }
                return this;
            });
    }

    public saveContext() {
        const deviceConfigFile = path.join(vscode.workspace.rootPath, DEVICE_CONFIG_FILE);
        let deviceContext = JSON.parse(fs.readFileSync(deviceConfigFile, "utf8"));
        deviceContext.sketch = this.sketch;
        deviceContext.port = this.port;
        deviceContext.board = this.board;

        fs.writeFileSync(path.join(vscode.workspace.rootPath, DEVICE_CONFIG_FILE), JSON.stringify(deviceContext, null, 4));
    }

    public get port() {
        return this._port;
    }
    public set port(value: string) {
        this._port = value;
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
