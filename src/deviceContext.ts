// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as constants from "./common/constants";
import * as util from "./common/util";
import * as Logger from "./logger/logger";

import { ARDUINO_CONFIG_FILE } from "./common/constants";
import { ArduinoWorkspace } from "./common/workspace";
import { SerialPortEnding } from "./serialmonitor/serialportctrl";

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
     * Baud Rate connect to the device
     * @property {number}
     */
    baud: number;

    /**
     * Line ending
     * @property {SerialPortEnding}
     */
    ending: SerialPortEnding;

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
     * Arduino build output path
     */

    output: string;
    /**
     * Arduino debugger
     */

    debugger_: string;

    /**
     * Current selected programmer.
     * @property {string}
     */
    programmer: string;

    /**
     * Arduino custom board configuration
     * @property {string}
     */
    configuration: string;

    onDidChange: vscode.Event<void>;

    initialize(): void;
}

export class DeviceContext implements IDeviceContext, vscode.Disposable {

    public static getInstance(): DeviceContext {
        return DeviceContext._deviceContext;
    }

    private static _deviceContext: DeviceContext = new DeviceContext();

    private _onDidChange = new vscode.EventEmitter<void>();

    private _port: string;

    private _baud: number;

    private _ending: SerialPortEnding;

    private _board: string;

    private _sketch: string;

    private _output: string;

    private _debugger: string;

    private _configuration: string;

    private _extensionPath: string;

    private _watcher: vscode.FileSystemWatcher;

    private _vscodeWatcher: vscode.FileSystemWatcher;

    private _sketchStatusBar: vscode.StatusBarItem;

    private _prebuild: string;

    private _programmer: string;

    /**
     * @constructor
     */
    private constructor() {
        if (vscode.workspace && ArduinoWorkspace.rootPath) {
            this._watcher = vscode.workspace.createFileSystemWatcher(path.join(ArduinoWorkspace.rootPath, ARDUINO_CONFIG_FILE));
            // We only care about the deletion arduino.json in the .vscode folder:
            this._vscodeWatcher = vscode.workspace.createFileSystemWatcher(path.join(ArduinoWorkspace.rootPath, ".vscode"), true, true, false);

            this._watcher.onDidCreate(() => this.loadContext());
            this._watcher.onDidChange(() => this.loadContext());
            this._watcher.onDidDelete(() => this.loadContext());
            this._vscodeWatcher.onDidDelete(() => this.loadContext());
            this._sketchStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.SKETCH);
            this._sketchStatusBar.command = "arduino.setSketchFile";
            this._sketchStatusBar.tooltip = "Sketch File";
        }
    }

    public dispose() {
        if (this._watcher) {
            this._watcher.dispose();
        }
        if (this._vscodeWatcher) {
            this._vscodeWatcher.dispose();
        }
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
                let baud: number = null;
                let ending: string = null;
                if (files && files.length > 0) {
                    const configFile = files[0];
                    deviceConfigJson = util.tryParseJSON(fs.readFileSync(configFile.fsPath, "utf8"));
                    if (deviceConfigJson) {
                        this._port = deviceConfigJson.port;
                        baud = deviceConfigJson.baud;
                        ending = deviceConfigJson.ending;
                        this._board = deviceConfigJson.board;
                        this._sketch = deviceConfigJson.sketch;
                        this._configuration = deviceConfigJson.configuration;
                        this._output = deviceConfigJson.output;
                        this._debugger = deviceConfigJson["debugger"];
                        this._onDidChange.fire();
                        this._prebuild = deviceConfigJson.prebuild;
                        this._programmer = deviceConfigJson.programmer;
                    } else {
                        Logger.notifyUserError("arduinoFileError", new Error(constants.messages.ARDUINO_FILE_ERROR));
                    }
                    Logger.info(`baud is ${baud}`);
                    Logger.info(`ending  is ${ending}`);
                    // Sanitize line ending
                    if ((ending) && (ending !== SerialPortEnding[SerialPortEnding[ending]])) {
                        vscode.window.showErrorMessage(`Unsupported ending ${ending}, using default.`);
                        ending = null;
                    }
                    // Sanitize baud rate
                    if ((baud) && (constants.SUPPORTED_BAUD_RATES.indexOf(baud) === -1)) {
                        vscode.window.showErrorMessage(`Unsupported baud rate ${baud}, using default.`);
                        baud = null;
                    }
                    this._baud = baud;
                    this._ending = (ending) ? SerialPortEnding[ending] : null;

                } else {
                    this._port = null;
                    this._baud = null;
                    this._ending = null;
                    this._board = null;
                    this._sketch = null;
                    this._configuration = null;
                    this._output = null;
                    this._debugger = null;
                    this._onDidChange.fire();
                    this._prebuild = null;
                    this._programmer = null;
                }
                return this;
            }, (reason) => {
                // Workaround for change in API.
                // vscode.workspace.findFiles() for some reason now throws an error ehn path does not exist
                // vscode.window.showErrorMessage(reason.toString());
                // Logger.notifyUserError("arduinoFileUnhandleError", new Error(reason.toString()));

                 // Workaround for change in API, populate required props for arduino.json
                this._port = null;
                this._baud = null;
                this._ending = null;
                this._board = null;
                this._sketch = null;
                this._configuration = null;
                this._output = null;
                this._debugger = null;
                this._onDidChange.fire();
                this._prebuild = null;
                this._programmer = null;

                return this;
            });
    }

    public showStatusBar() {
        if (!this._sketch) {
            return false;
        }

        this._sketchStatusBar.text = this._sketch;
        this._sketchStatusBar.show();
    }

    public saveContext() {
        if (!ArduinoWorkspace.rootPath) {
            return;
        }
        const deviceConfigFile = path.join(ArduinoWorkspace.rootPath, ARDUINO_CONFIG_FILE);
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
        deviceConfigJson.baud = this.baud;
        deviceConfigJson.ending = (this.ending != null) ? SerialPortEnding[this.ending] : undefined;
        deviceConfigJson.board = this.board;
        deviceConfigJson.output = this.output;
        deviceConfigJson["debugger"] = this.debugger_;
        deviceConfigJson.configuration = this.configuration;
        deviceConfigJson.programmer = this.programmer;

        util.mkdirRecursivelySync(path.dirname(deviceConfigFile));
        fs.writeFileSync(deviceConfigFile, JSON.stringify(deviceConfigJson, (key, value) => {
            if (value === null) {
                return undefined;
            }
            return value;
        }, 4));
    }

    public get onDidChange(): vscode.Event<void> {
        return this._onDidChange.event;
    }

    public get port() {
        return this._port;
    }

    public set port(value: string) {
        this._port = value;
        this.saveContext();
    }

    public get baud() {
        return this._baud;
    }

    public set baud(value: number) {
        this._baud = value;
        this.saveContext();
    }

    public get ending() {
        return this._ending;
    }

    public set ending(value: SerialPortEnding) {
        this._ending = value;
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

    public get prebuild() {
        return this._prebuild ? this._prebuild.trim() : "";
    }

    public get output() {
        return this._output;
    }

    public set output(value: string) {
        this._output = value;
        this.saveContext();
    }

    public get debugger_() {
        return this._debugger;
    }

    public set debugger_(value: string) {
        this._debugger = value;
        this.saveContext();
    }

    public get configuration() {
        return this._configuration;
    }

    public set configuration(value: string) {
        this._configuration = value;
        this.saveContext();
    }

    public get programmer() {
        return this._programmer;
    }

    public set programmer(value: string) {
        this._programmer = value;
        this.saveContext();
    }

    public async initialize() {
        if (ArduinoWorkspace.rootPath && util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, ARDUINO_CONFIG_FILE))) {
            vscode.window.showInformationMessage("Arduino.json is already generated.");
            return;
        } else {
            if (!ArduinoWorkspace.rootPath) {
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
                        fs.writeFileSync(path.join(ArduinoWorkspace.rootPath, newSketchFileName), snippets);
                        this.sketch = newSketchFileName;
                        // Open the new sketch file.
                        const textDocument = await vscode.workspace.openTextDocument(path.join(ArduinoWorkspace.rootPath, newSketchFileName));
                        vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One, true);
                    } else {
                        this._sketch = undefined;
                    }
                } else if (fileUris.length === 1) {
                    this.sketch = path.relative(ArduinoWorkspace.rootPath, fileUris[0].fsPath);
                } else if (fileUris.length > 1) {
                    const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>fileUris.map((fileUri): vscode.QuickPickItem => {
                        return <vscode.QuickPickItem>{
                            label: path.relative(ArduinoWorkspace.rootPath, fileUri.fsPath),
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
