/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as constants from "./common/constants";
import * as util from "./common/util";
import * as Logger from "./logger/logger";

import { ArduinoApp } from "./arduino/arduino";
import { IBoard } from "./arduino/package";
import { ARDUINO_CONFIG_FILE } from "./common/constants";

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

    /**
     * Arduino custom board configuration
     * @property {string}
     */
    configuration: string;

    initialize(): void;
}

export class DeviceContext implements IDeviceContext, vscode.Disposable {

    public static getIntance(): DeviceContext {
        return DeviceContext._deviceContext;
    }

    private static _deviceContext: DeviceContext = new DeviceContext();

    private _port: string;

    private _board: string;

    private _sketch: string;

    private _configuration: string;

    private _arduinoApp: ArduinoApp;

    private _extensionPath: string;

    private _watcher: vscode.FileSystemWatcher;

    /**
     * @constructor
     */
    private constructor() {
        if (vscode.workspace && vscode.workspace.rootPath) {
            this._watcher = vscode.workspace.createFileSystemWatcher(path.join(vscode.workspace.rootPath, ARDUINO_CONFIG_FILE));
            this._watcher.onDidCreate(() => this.loadContext());
            this._watcher.onDidChange(() => this.loadContext());
            this._watcher.onDidDelete(() => this.loadContext());
        }
    }

    public dispose() {
        if (this._watcher) {
            this._watcher.dispose();
        }
    }

    public get arduinoApp(): ArduinoApp {
        return this._arduinoApp;
    }

    public set arduinoApp(value: ArduinoApp) {
        this._arduinoApp = value;
    }

    public get extensionPath(): string {
        return this._extensionPath;
    }

    public set extensionPath(value: string) {
        this._extensionPath = value;
    }

    /**
     * TODO: Current we use the Arduino default settings. For future release, this dependency might be removed
     * and the setting only depends on device.json.
     * @method
     */
    public loadContext(): Thenable<object> {
        return vscode.workspace.findFiles(ARDUINO_CONFIG_FILE, null, 1)
            .then((files) => {
                let deviceConfigJson: any = {};
                if (files && files.length > 0) {
                    const configFile = files[0];
                    deviceConfigJson = util.tryParseJSON(fs.readFileSync(configFile.fsPath, "utf8"));
                    if (deviceConfigJson) {
                        this._port = deviceConfigJson.port || this._port;
                        this._board = deviceConfigJson.board || this._board;
                        this._sketch = deviceConfigJson.sketch || this._sketch;
                        this._configuration = deviceConfigJson.configuration || this._configuration;
                    } else {
                        Logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
                    }
                }
                return this;
            });
    }

    public saveContext() {
        if (!vscode.workspace.rootPath) {
            return;
        }
        const deviceConfigFile = path.join(vscode.workspace.rootPath, ARDUINO_CONFIG_FILE);
        let deviceConfigJson: any = {};
        if (util.fileExistsSync(deviceConfigFile)) {
            deviceConfigJson = util.tryParseJSON(fs.readFileSync(deviceConfigFile, "utf8"));
        }
        if (!deviceConfigJson) {
            Logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
            return;
        }
        deviceConfigJson.sketch = this.sketch;
        deviceConfigJson.port = this.port;
        deviceConfigJson.board = this.board;
        deviceConfigJson.configuration = this.configuration;

        util.mkdirRecursivelySync(path.dirname(deviceConfigFile));
        fs.writeFileSync(deviceConfigFile, JSON.stringify(deviceConfigJson, null, 4));
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
        this.saveContext();
    }

    public get configuration() {
        return this._configuration;
    }

    public set configuration(value: string) {
        this._configuration = value;
        this.saveContext();
    }

    public async initialize() {
        if (vscode.workspace.rootPath && util.fileExistsSync(path.join(vscode.workspace.rootPath, ARDUINO_CONFIG_FILE))) {
            vscode.window.showInformationMessage("Arduino.json is already generated.");
            return;
        } else {
            if (!vscode.workspace.rootPath) {
                vscode.window.showInformationMessage("Please open an folder first.");
                return;
            }
            await this.resolveMainSketch();
            if (this.sketch) {
                await vscode.commands.executeCommand("arduino.changeBoardType");
                vscode.window.showInformationMessage("The workspace is initialized with the Arduino extension support.");
            } else {
                vscode.window.showInformationMessage("No *.ino sketch file was found or selected, so skip initialize command.");
            }
        }
    }

    public async resolveMainSketch() {
        return await vscode.workspace.findFiles("**/*.ino", null)
            .then(async (fileUris) => {
                if (fileUris.length === 0) {
                    let newSketchFileName = await vscode.window.showInputBox({
                        value: "app.ino",
                        prompt: "No .ino file was found on workspace, initialize sketch first",
                        placeHolder: "Input the sketch file name",
                        validateInput: (value) => {
                            if (value && /^\w+\.((ino)|(cpp)|c)$/.test(value.trim())) {
                                return null;
                            } else {
                                return "Invalid sketch file name. Should be *.ino/*.cpp/*.c";
                            }
                        },
                    });
                    newSketchFileName = (newSketchFileName && newSketchFileName.trim()) || "";
                    if (newSketchFileName) {
                        const snippets = fs.readFileSync(path.join(this.extensionPath, "snippets", "sample.ino"));
                        fs.writeFileSync(path.join(vscode.workspace.rootPath, newSketchFileName), snippets);
                        this.sketch = newSketchFileName;
                        // Open the new sketch file.
                        const textDocument = await vscode.workspace.openTextDocument(path.join(vscode.workspace.rootPath, newSketchFileName));
                        vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One, true);
                    } else {
                        this._sketch = undefined;
                    }
                } else if (fileUris.length === 1) {
                    this.sketch = path.relative(vscode.workspace.rootPath, fileUris[0].fsPath);
                } else if (fileUris.length > 1) {
                    const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>fileUris.map((fileUri): vscode.QuickPickItem => {
                        return <vscode.QuickPickItem>{
                            label: path.relative(vscode.workspace.rootPath, fileUri.fsPath),
                            description: fileUri.fsPath,
                        };
                    }), { placeHolder: "Select the main sketch file" });
                    if (chosen && chosen.label) {
                        this.sketch = chosen.label;
                    }
                }
            });
    }
}
