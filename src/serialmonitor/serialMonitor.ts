/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import * as Logger from "../logger/logger";
import { SerialPortCtrl } from "./serialportctrl";

export interface ISerialPortDetail {
    comName: string;
    manufacturer: string;
    vendorId: string;
    productId: string;
}

export class SerialMonitor {
    public static DEFAULT_BAUD_RATE: number = 9600;

    public static listBaudRates(): number[] {
        return [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];
    }

    private _currentPort: string;

    private _currentBaudRate: number;

    private _portsStatusBar: vscode.StatusBarItem;

    private _openPortStatusBar: vscode.StatusBarItem;

    private _baudRateStatusBar: vscode.StatusBarItem;

    private _serialPortCtrl: SerialPortCtrl = null;

    constructor() {
        this._currentBaudRate = SerialMonitor.DEFAULT_BAUD_RATE;
        this._portsStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
        this._portsStatusBar.command = "arduino.selectSerialPort";
        this._portsStatusBar.tooltip = "Select Serial Port";
        this._portsStatusBar.show();

        this._openPortStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 3);
        this._openPortStatusBar.command = "arduino.openSerialMonitor";
        this._openPortStatusBar.text = `$(key)`;
        this._openPortStatusBar.tooltip = "Open Port";
        this._openPortStatusBar.show();

        this._baudRateStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 4);
        this._baudRateStatusBar.command = "arduino.changeBaudRate";
        this._baudRateStatusBar.tooltip = "Baud Rate";
        this._baudRateStatusBar.text = SerialMonitor.DEFAULT_BAUD_RATE.toString();
        this.updatePortListStatus(null);
    }

    public async selectSerialPort() {
        let lists = await SerialPortCtrl.list();
        if (!lists.length) {
            vscode.window.showInformationMessage("No serial port is available.");
            return;
        }

        let chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>lists.map((l: ISerialPortDetail): vscode.QuickPickItem => {
            return {
                description: l.manufacturer,
                label: l.comName,
            };
        }).sort((a, b): number => {
            return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
        }));
        if (chosen && chosen.label) {
            this.updatePortListStatus(chosen.label);
        }
    }

    public async openSerialMonitor() {
        if (this._serialPortCtrl) {
            await this._serialPortCtrl.changePort(this._currentPort);
        } else {
            this._serialPortCtrl = new SerialPortCtrl(this._currentPort, this._currentBaudRate);
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
        if (this._serialPortCtrl && this._serialPortCtrl.isActive()) {
            let text = await vscode.window.showInputBox();
            try {
                await this._serialPortCtrl.sendMessage(text);
            } catch (error) {
                Logger.notifyUserWarning("sendMessageToSerialPortError", error, constants.messages.FAILED_SEND_SERIALPORT);
            }
        } else {
            Logger.notifyUserWarning("sendMessageToSerialPortError", new Error(constants.messages.SEND_BEFORE_OPEN_SERIALPORT));
        }
    }

    public async  changeBaudRate() {
        let rates = SerialMonitor.listBaudRates();
        let choose = await vscode.window.showQuickPick(rates.map((rate) => rate.toString()));
        if (!choose) {
            Logger.warn("No rate is selected, keep baud rate no changed.");
            return;
        }
        if (!parseInt(choose, 10)) {
            Logger.warn("Invalid baud rate, keep baud rate no changed.", {value: choose});
            return;
        }
        if (!this._serialPortCtrl) {
            Logger.warn("Serial Monitor have not been started!");
            return;
        }
        return await this._serialPortCtrl.changeBaudRate(parseInt(choose, 10));
    }

    public async closeSerialMonitor() {
        if (this._serialPortCtrl) {
            await this._serialPortCtrl.stop();
            this.updatePortStatus(false);
        } else {
            Logger.notifyUserWarning("closeSerialMonitorError", new Error(constants.messages.SERIAL_PORT_NOT_STARTED));
        }
    }

    private updatePortListStatus(port: string) {
        const dc = DeviceContext.getIntance();
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
            this._baudRateStatusBar.show();
        } else {
            this._openPortStatusBar.command = "arduino.openSerialMonitor";
            this._openPortStatusBar.text = `$(key)`;
            this._openPortStatusBar.tooltip = "Open Serial Monitor";
            this._baudRateStatusBar.hide();
        }

    }
}
