// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import ArduinoContext from "../arduinoContext";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import * as Logger from "../logger/logger";
import { SerialPortCtrl, SerialPortEnding } from "./serialportctrl";

export interface ISerialPortDetail {
    comName: string;
    manufacturer: string;
    vendorId: string;
    productId: string;
}

export class SerialMonitor implements vscode.Disposable {

    public static SERIAL_MONITOR: string = "Serial Monitor";

    public static DEFAULT_BAUD_RATE: number = constants.DEFAULT_BAUD_RATE;

    public static DEFAULT_ENDING: SerialPortEnding = SerialPortEnding[constants.DEFAULT_LINE_ENDING];

    public static listBaudRates(): number[] {
        return constants.SUPPORTED_BAUD_RATES;
    }

    public static getInstance(): SerialMonitor {
        if (SerialMonitor._serialMonitor === null) {
            SerialMonitor._serialMonitor = new SerialMonitor();
        }
        return SerialMonitor._serialMonitor;
    }

    private static _serialMonitor: SerialMonitor = null;

    private _currentPort: string;

    private _currentBaudRate: number;

    private _portsStatusBar: vscode.StatusBarItem;

    private _openPortStatusBar: vscode.StatusBarItem;

    private _baudRateStatusBar: vscode.StatusBarItem;

    private _endingStatusBar: vscode.StatusBarItem;

    private _serialPortCtrl: SerialPortCtrl = null;

    private _outputChannel: vscode.OutputChannel;

    private _ending: SerialPortEnding;

    private constructor() {
        const dc = DeviceContext.getInstance();
        dc.onDidChange(() => {
            if (dc.port) {
                if (!this.initialized) {
                    this.initialize();
                }
                this.updatePortListStatus(null);
            }
        });
    }

    public initialize() {
        const dc = DeviceContext.getInstance();
        const dcending: SerialPortEnding = dc.ending || SerialMonitor.DEFAULT_ENDING;

        const defaultBaudRate = ((ArduinoContext.arduinoApp) ? ArduinoContext.arduinoApp.settings.defaultBaudRate : null) ||
                                SerialMonitor.DEFAULT_BAUD_RATE;

        this._outputChannel = vscode.window.createOutputChannel(SerialMonitor.SERIAL_MONITOR);
        this._currentBaudRate = dc.baud || defaultBaudRate;

        this._portsStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.PORT);
        this._portsStatusBar.command = "arduino.selectSerialPort";
        this._portsStatusBar.tooltip = "Select Serial Port";
        this._portsStatusBar.show();

        this._openPortStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.OPEN_PORT);
        this._openPortStatusBar.command = "arduino.openSerialMonitor";
        this._openPortStatusBar.text = `$(plug)`;
        this._openPortStatusBar.tooltip = "Open Serial Monitor";
        this._openPortStatusBar.show();

        this._baudRateStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.BAUD_RATE);
        this._baudRateStatusBar.command = "arduino.changeBaudRate";
        this._baudRateStatusBar.tooltip = "Baud Rate";
        this._baudRateStatusBar.text = defaultBaudRate.toString();
        this._baudRateStatusBar.show();

        this._endingStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.ENDING);
        this._ending = dcending;
        this._endingStatusBar.command = "arduino.changeEnding";
        this._endingStatusBar.tooltip = "Serial Port Line Ending";
        this._endingStatusBar.text = SerialPortEnding[dcending];
        this._endingStatusBar.show();

        this.updatePortListStatus(null);
    }
    public get initialized(): boolean {
        return !!this._outputChannel;
    }

    public dispose() {
        if (this._serialPortCtrl && this._serialPortCtrl.isActive) {
            return this._serialPortCtrl.stop();
        }
    }

    public async selectSerialPort(vid: string, pid: string) {
        const lists = await SerialPortCtrl.list();
        if (!lists.length) {
            vscode.window.showInformationMessage("No serial port is available.");
            return;
        }

        if (vid && pid) {
            const valueOfVid = parseInt(vid, 16);
            const valueOfPid = parseInt(pid, 16);
            const foundPort = lists.find((p) => {
                // The pid and vid returned by SerialPortCtrl start with 0x prefix in Mac, but no 0x prefix in Win32.
                // Should compare with decimal value to keep compatibility.
                if (p.productId && p.vendorId) {
                    return parseInt(p.productId, 16) === valueOfPid && parseInt(p.vendorId, 16) === valueOfVid;
                }
                return false;
            });
            if (foundPort && !(this._serialPortCtrl && this._serialPortCtrl.isActive)) {
                this.updatePortListStatus(foundPort.comName);
            }
        } else {
            const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>lists.map((l: ISerialPortDetail): vscode.QuickPickItem => {
                return {
                    description: l.manufacturer,
                    label: l.comName,
                };
            }).sort((a, b): number => {
                return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
            }), { placeHolder: "Select a serial port" });
            if (chosen && chosen.label) {
                this.updatePortListStatus(chosen.label);
            }
        }
    }

    public async openSerialMonitor() {
        if (!this._currentPort) {
            const ans = await vscode.window.showInformationMessage("No serial port was selected, please select a serial port first", "Yes", "No");
            if (ans === "Yes") {
                await this.selectSerialPort(null, null);
            }
            if (!this._currentPort) {
                return;
            }
        }

        if (this._serialPortCtrl) {
            if (this._currentPort !== this._serialPortCtrl.currentPort) {
                await this._serialPortCtrl.changePort(this._currentPort);
            } else if (this._serialPortCtrl.isActive) {
                vscode.window.showWarningMessage(`Serial monitor is already opened for ${this._currentPort}`);
                return;
            }
        } else {
            this._serialPortCtrl = new SerialPortCtrl(this._currentPort, this._currentBaudRate, this._ending, this._outputChannel);
        }

        if (!this._serialPortCtrl.currentPort) {
            Logger.traceError("openSerialMonitorError", new Error(`Failed to open serial port ${this._currentPort}`));
            return;
        }

        try {
            await this._serialPortCtrl.open();
            this.updatePortStatus(true);
        } catch (error) {
            Logger.notifyUserWarning("openSerialMonitorError", error,
                `Failed to open serial port ${this._currentPort} due to error: + ${error.toString()}`);
        }
    }

    public async sendMessageToSerialPort() {
        if (this._serialPortCtrl && this._serialPortCtrl.isActive) {
            const text = await vscode.window.showInputBox();
            try {
                await this._serialPortCtrl.sendMessage(text);
            } catch (error) {
                Logger.notifyUserWarning("sendMessageToSerialPortError", error, constants.messages.FAILED_SEND_SERIALPORT);
            }
        } else {
            Logger.notifyUserWarning("sendMessageToSerialPortError", new Error(constants.messages.SEND_BEFORE_OPEN_SERIALPORT));
        }
    }

    public async changeBaudRate() {
        const rates = SerialMonitor.listBaudRates();
        const chosen = await vscode.window.showQuickPick(rates.map((rate) => rate.toString()));
        if (!chosen) {
            Logger.warn("No rate is selected, keep baud rate no changed.");
            return;
        }
        const selectedRate: number = parseInt(chosen, 10);
        if (!parseInt(chosen, 10) || (constants.SUPPORTED_BAUD_RATES.indexOf(selectedRate) === -1)) {
            Logger.warn("Invalid baud rate, keep baud rate no changed.", { value: chosen });
            return;
        }
        const dc = DeviceContext.getInstance();
        dc.baud = selectedRate;
        this._currentBaudRate = selectedRate;
        this._baudRateStatusBar.text = chosen;
        if (this._serialPortCtrl) {
            await this._serialPortCtrl.changeBaudRate(selectedRate);
        }
    }

    public async changeEnding() {
        const chosen: string|undefined = await vscode.window.showQuickPick(Object.keys(SerialPortEnding)
            .filter((key) => {
                return !isNaN(Number(SerialPortEnding[key]));
            }), { placeHolder: "Select serial port ending" });
        if (!chosen) {
            return;
        }
        const dc = DeviceContext.getInstance();
        dc.ending = SerialPortEnding[chosen];
        this._ending = SerialPortEnding[chosen];
        this._endingStatusBar.text = chosen;
        if (this._serialPortCtrl) {
            this._serialPortCtrl.changeEnding(this._ending);
        }
    }

    public async closeSerialMonitor(port: string, showWarning: boolean = true): Promise<boolean> {
        if (this._serialPortCtrl) {
            if (port && port !== this._serialPortCtrl.currentPort) {
                // Port is not opened
                return false;
            }
            const result = await this._serialPortCtrl.stop();
            this.updatePortStatus(false);
            return result;
        } else if (!port && showWarning) {
            Logger.notifyUserWarning("closeSerialMonitorError", new Error(constants.messages.SERIAL_PORT_NOT_STARTED));
            return false;
        }
    }

    private updatePortListStatus(port: string) {
        const dc = DeviceContext.getInstance();
        if (port) {
            dc.port = port;
        }
        this._currentPort = dc.port;

        if (dc.port) {
            this._portsStatusBar.text = dc.port;
        } else {
            this._portsStatusBar.text = "<Select Serial Port>";
        }
    }

    private updatePortStatus(isOpened: boolean) {
        if (isOpened) {
            this._openPortStatusBar.command = "arduino.closeSerialMonitor";
            this._openPortStatusBar.text = `$(x)`;
            this._openPortStatusBar.tooltip = "Close Serial Monitor";
            //this._baudRateStatusBar.show();
            //this._endingStatusBar.show();
        } else {
            this._openPortStatusBar.command = "arduino.openSerialMonitor";
            this._openPortStatusBar.text = `$(plug)`;
            this._openPortStatusBar.tooltip = "Open Serial Monitor";
            //this._baudRateStatusBar.hide();
            //this._endingStatusBar.hide();
        }

    }
}
