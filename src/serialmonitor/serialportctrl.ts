/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import { OutputChannel, QuickPickItem, StatusBarAlignment, StatusBarItem, window } from "vscode";

interface ISerialPortDetail {
     comName: string;
     manufacturer: string;
     vendorId: string;
     productId: string;
}

class SerialPortCtrl {
    public static SERIAL_MONITOR: string = "Serial Monitor";
    public static DEFAULT_BAUD_RATE: number = 9600;

    public static list(): Promise<ISerialPortDetail[]> {
        return new Promise((resolve, reject) => {
            SerialPortCtrl.serialport.list((e: any, ports: ISerialPortDetail[]) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(ports);
                }
            });
        });
    }

    public static listBaudRates(): number[] {
        return [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000];
    }
    private static serialport = require("../../../vendor/serialport-native");
    private _portStatusBar: StatusBarItem;
    private _baudRateStatusBar: StatusBarItem;
    private _outputChannel: OutputChannel;

    private _currentPort: string;
    private _currentBaudRate: number;
    private _currentSerialPort = null;

    public constructor(port: string, baudRate: number = 0) {
        this._currentBaudRate = baudRate || SerialPortCtrl.DEFAULT_BAUD_RATE;
        this._currentPort = port;
    }

    public open(): Promise<any> {
        if (this._outputChannel) {
            this._outputChannel.clear();
        } else {
            this._outputChannel = window.createOutputChannel(SerialPortCtrl.SERIAL_MONITOR);
            this._portStatusBar = window.createStatusBarItem(StatusBarAlignment.Right, 2);
            this._portStatusBar.command = "arduino.openSerialPort";
            this._portStatusBar.text = this._currentPort;
            this._portStatusBar.tooltip = "Change Port";
            this._portStatusBar.show();

            this._baudRateStatusBar = window.createStatusBarItem(StatusBarAlignment.Right, 1);
            this._baudRateStatusBar.command = "arduino.changeBaudRate";
            this._baudRateStatusBar.text = this._currentBaudRate.toString();
            this._baudRateStatusBar.tooltip = "Baud Rate";
            this._baudRateStatusBar.show();
        }
        return new Promise((resolve, reject) => {
            if (this._currentSerialPort && this._currentSerialPort.isOpen()) {
                this._currentSerialPort.close((err) => {
                    if (err) {
                        return reject(err);
                    }
                    this._currentSerialPort = null;
                    return this.open().then(() => {
                        resolve();
                    }, (error) => {
                        reject(error);
                    });
                });
            } else {
                this._portStatusBar.text = this._currentPort;
                this._baudRateStatusBar.text = this._currentBaudRate.toString();
                this._currentSerialPort = new SerialPortCtrl.serialport(this._currentPort, {baudRate: this._currentBaudRate});
                this._outputChannel.show();
                this._currentSerialPort.on("data", (_event) => {
                    this._outputChannel.append(_event.toString());
                });

                this._currentSerialPort.on("error", (_error) => {
                    this._outputChannel.appendLine("[Error]" + _error.toString());
                });
            }
        });
    }

    public isActive(): boolean {
        return this._currentSerialPort && this._currentSerialPort.isOpen();
    }

    public sendMessage(text: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!text || !this._currentSerialPort || !this.isActive()) {
                resolve();
                return;
            }

            this._currentSerialPort.write(text, (error) => {
                if (!error) {
                    resolve();
                } else {
                    return reject(error);
                }
            });
        });
    }

     public changePort(newPort: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._currentPort = newPort;
            if (!this._currentSerialPort || !this.isActive()) {
                resolve();
                return;
            }
            this._currentSerialPort.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this._currentSerialPort = null;
                    resolve();
                }
            } );
        });
    }

    public stop(): Promise<any> {
       return new Promise((resolve, reject) => {
            if (!this._currentSerialPort || !this.isActive()) {
                resolve();
                return;
            }
            this._currentSerialPort.close((err) => {
                if (this._outputChannel) {
                    this._outputChannel.appendLine("User stopped!");
                }
                this._currentSerialPort = null;
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    public changeBaudRate(newRate: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this._currentBaudRate = newRate;
            if (!this._currentSerialPort || !this.isActive()) {
                resolve();
                return;
            }
            this._baudRateStatusBar.text = this._currentBaudRate.toString();
            this._currentSerialPort.update({baudRate: this._currentBaudRate}, (err) => {
               if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            } );
        });
    }
}
let ctrl: SerialPortCtrl = null;
export async function openSerialPort() {
    let lists = await SerialPortCtrl.list();
    if (!lists.length) {
        window.showInformationMessage("No serial port is available.");
        return;
    }

    let chosen = await window.showQuickPick(<QuickPickItem[]> lists.map((l: ISerialPortDetail): QuickPickItem => {
            return {
                description: l.manufacturer,
                label: l.comName,
            };
    }).sort((a, b): number => {
        return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
    }));
    if (chosen && chosen.label) {
       if (ctrl) {
           await ctrl.changePort(chosen.label);
       } else {
           ctrl = new SerialPortCtrl(chosen.label);
       }
       try {
           return await ctrl.open();
       } catch (error) {
           window.showWarningMessage(`Failed to open serial port ${chosen.label} due to error:  + ${error.toString()}`);
       }
    }
}

export async function sendMessageToSerialPort() {
     if (ctrl && ctrl.isActive()) {
        let text = await window.showInputBox();
        try {
            await ctrl.sendMessage(text);
        } catch (error) {
            window.showWarningMessage("Failed to send message due to error: " + error.toString());
        }
    } else {
        window.showWarningMessage("Please open a serial port first!");
    }
}

export async function changeBaudRate() {
    let rates = SerialPortCtrl.listBaudRates();
    let choose = await window.showQuickPick(rates.map((rate) => rate.toString()));
    if (!choose) {
            // console.log('No rate is selected, keep baud rate no changed.');
            return;
    }
    if (!parseInt(choose, 10)) {
        // console.log('Invalid baud rate, keep baud rate no changed.', choose);
        return;
    }
    if (!ctrl) {
        // console.log('Serial Monitor have not been started!');
        return;
    }
    return await ctrl.changeBaudRate(parseInt(choose, 10));
}

export function closeSerialPort() {
    if (ctrl) {
        return ctrl.stop();
    } else {
        window.showWarningMessage("Serial Monitor has not been started!");
    }
}
