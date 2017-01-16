import { OutputChannel, QuickPickItem, StatusBarAlignment, StatusBarItem, window } from "vscode";
import _ = require("lodash");

interface ISerialPortDetail {
     comName: string;
     manufacturer: string;
     vendorId: string;
     productId: string;
};

class SerialPortCtrl {
    public static SERIAL_MONITOR: string = "Serial Monitor";
    public static DEFAULT_BAUD_RATE: number = 9600;
    static serialport = require("../../../vendor/serialport");
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
            this._portStatusBar.command = "extension.openSerialPort";
            this._portStatusBar.text = this._currentPort;
            this._portStatusBar.tooltip = "Change Port";
            this._portStatusBar.show();

            this._baudRateStatusBar = window.createStatusBarItem(StatusBarAlignment.Right, 1);
            this._baudRateStatusBar.command = "extension.changBaudRate";
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
                const serialport = require("../../../vendor/serialport");
                this._baudRateStatusBar.text = this._currentBaudRate.toString();
                this._currentSerialPort = new SerialPortCtrl.serialport(this._currentPort, {baudRate: this._currentBaudRate});
                this._outputChannel.show();
                this._currentSerialPort.on("data", (_event) => {
                    this._outputChannel.append(_event.toString());
                });

                this._currentSerialPort.on("error", (_event) => {
                    this._outputChannel.appendLine("[Error]" + _event.toString());
                });
            }
        });
    }

    public isActive(): boolean {
        return this._currentSerialPort && this._currentSerialPort.isOpen();
    }

    public sendMessage(text: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!text) {
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
        if (this._currentPort === newPort) {
            return;
        }
        this._currentPort = newPort;
        if (!this._currentSerialPort) {
            return;
        }
        return new Promise((resolve, reject) => {
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
           if (!this._currentSerialPort) {
               return resolve();
           }
           if (!this._currentSerialPort.isOpen()) {
               return resolve();
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
        this._currentBaudRate = newRate;
        if (!this._currentSerialPort) {
            return;
        }

        return new Promise((resolve, reject) => {
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
};
let ctrl: SerialPortCtrl = null;
export async function openSerialPort() {
    let lists = await SerialPortCtrl.list();
    if (!lists.length) {
        window.showInformationMessage("No serial port is available.");
        return;
    }

    let chosen = await window.showQuickPick(<QuickPickItem[]> _.sortBy(_.map(lists, (l: ISerialPortDetail): QuickPickItem => {
            return {
                description: l.manufacturer,
                label: l.comName,
            };
    }), "label"));
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

export async function changBaudRate() {
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
    return ctrl.stop();
}
