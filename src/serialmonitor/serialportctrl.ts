/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as os from "os";
import { OutputChannel, QuickPickItem, StatusBarAlignment, StatusBarItem, window } from "vscode";

interface ISerialPortDetail {
    comName: string;
    manufacturer: string;
    vendorId: string;
    productId: string;
}

export class SerialPortCtrl {
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

    private static serialport = require("../../../vendor/serialport-native");

    private _currentPort: string;
    private _currentBaudRate: number;
    private _currentSerialPort = null;

    public constructor(port: string, baudRate: number, private _outputChannel: OutputChannel) {
        this._currentBaudRate = baudRate;
        this._currentPort = port;
    }

    public get isActive(): boolean {
        return this._currentSerialPort && this._currentSerialPort.isOpen();
    }

    public get currentPort(): string {
        return this._currentPort;
    }

    public open(): Promise<any> {
        this._outputChannel.appendLine(`[Starting] Opening the serial port - ${this._currentPort}`);
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
                this._currentSerialPort = new SerialPortCtrl.serialport(this._currentPort, { baudRate: this._currentBaudRate });
                this._outputChannel.show();
                this._currentSerialPort.on("open", () => {
                    this._currentSerialPort.write("TestingOpen", (err) => {
                        // TODO: Fix this on the serial port lib: https://github.com/EmergingTechnologyAdvisors/node-serialport/issues/795
                        if (err && !(err.message.indexOf("Writing to COM port (GetOverlappedResult): Unknown error code 121") >= 0)) {
                            this._outputChannel.appendLine(`[Error] Failed to open the serial port - ${this._currentPort}`);
                            reject(err);
                        } else {
                            this._outputChannel.appendLine(`[Info] Opened the serial port - ${this._currentPort}`);
                            resolve();
                        }
                    });
                });

                this._currentSerialPort.on("data", (_event) => {
                    this._outputChannel.append(_event.toString());
                });

                this._currentSerialPort.on("error", (_error) => {
                    this._outputChannel.appendLine("[Error]" + _error.toString());
                });
            }
        });
    }

    public sendMessage(text: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!text || !this._currentSerialPort || !this.isActive) {
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
            if (newPort === this._currentPort) {
                resolve();
                return;
            }
            this._currentPort = newPort;
            if (!this._currentSerialPort || !this.isActive) {
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
            });
        });
    }

    public stop(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this._currentSerialPort || !this.isActive) {
                resolve();
                return;
            }
            this._currentSerialPort.close((err) => {
                if (this._outputChannel) {
                    this._outputChannel.appendLine(`[Done] Closed the serial port ${os.EOL}`);
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
            if (!this._currentSerialPort || !this.isActive) {
                resolve();
                return;
            }
            this._currentSerialPort.update({ baudRate: this._currentBaudRate }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
