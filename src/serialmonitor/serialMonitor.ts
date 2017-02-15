/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

import { DeviceContext } from "../deviceContext";
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
        this._portsStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
        this._portsStatusBar.command = "arduino.changeSerialPort";
        this._portsStatusBar.tooltip = "Select Port";
        this._portsStatusBar.show();

        this._openPortStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 3);
        this._openPortStatusBar.command = "arduino.openSerialPort";
        this._openPortStatusBar.text = `$(key)`;
        this._openPortStatusBar.tooltip = "Open Port";
        this._openPortStatusBar.show();

        this._baudRateStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 4);
        this._baudRateStatusBar.command = "arduino.changeBaudRate";
        this._baudRateStatusBar.tooltip = "Baud Rate";
        this._baudRateStatusBar.text = SerialMonitor.DEFAULT_BAUD_RATE.toString();
        this.updatePortListStatus(null);
    }

    public async changeSerialPort() {
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

    public async  openSerialPort() {
        if (this._serialPortCtrl) {
            await this._serialPortCtrl.changePort(this._currentPort);
        } else {
            this._serialPortCtrl = new SerialPortCtrl(this._currentPort, this._currentBaudRate);
        }
        try {
            await this._serialPortCtrl.open();
            this.updatePortStatus(true);
        } catch (error) {
            vscode.window.showWarningMessage(`Failed to open serial port ${this._currentPort} due to error:  + ${error.toString()}`);
        }
    }

    public async  sendMessageToSerialPort() {
        if (this._serialPortCtrl && this._serialPortCtrl.isActive()) {
            let text = await vscode.window.showInputBox();
            try {
                await this._serialPortCtrl.sendMessage(text);
            } catch (error) {
                vscode.window.showWarningMessage("Failed to send message due to error: " + error.toString());
            }
        } else {
            vscode.window.showWarningMessage("Please open a serial port first!");
        }
    }

    public async  changeBaudRate() {
        let rates = SerialMonitor.listBaudRates();
        let choose = await vscode.window.showQuickPick(rates.map((rate) => rate.toString()));
        if (!choose) {
            // console.log('No rate is selected, keep baud rate no changed.');
            return;
        }
        if (!parseInt(choose, 10)) {
            // console.log('Invalid baud rate, keep baud rate no changed.', choose);
            return;
        }
        if (!this._serialPortCtrl) {
            // console.log('Serial Monitor have not been started!');
            return;
        }
        return await this._serialPortCtrl.changeBaudRate(parseInt(choose, 10));
    }

    public async closeSerialPort() {
        if (this._serialPortCtrl) {
            await this._serialPortCtrl.stop();
            this.updatePortStatus(false);
        } else {
            vscode.window.showWarningMessage("Serial Monitor has not been started!");
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
            this._openPortStatusBar.command = "arduino.closeSerialPort";
            this._openPortStatusBar.text = `$(x)`;
            this._openPortStatusBar.tooltip = "close Port";
            this._baudRateStatusBar.show();
        } else {
            this._openPortStatusBar.command = "arduino.openSerialPort";
            this._openPortStatusBar.text = `$(key)`;
            this._openPortStatusBar.tooltip = "Open Port";
            this._baudRateStatusBar.hide();
        }

    }
}
