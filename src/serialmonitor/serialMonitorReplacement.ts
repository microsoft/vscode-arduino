// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { getSerialMonitorApi,  LineEnding, Parity, SerialMonitorApi, StopBits, Version } from "@microsoft/vscode-serial-monitor-api";
import * as vscode from "vscode";
import { ISerialPortDetail } from "./serialMonitor";
import { SerialPortCtrl } from "./serialportctrl";

export class SerialMonitorReplacement implements vscode.Disposable {
    public static listBaudRates(): number[] {
        return [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000];
    }

    public static getInstance(): SerialMonitorReplacement {
        if (SerialMonitorReplacement._serialMonitor === null) {
            SerialMonitorReplacement._serialMonitor = new SerialMonitorReplacement();
        }
        return SerialMonitorReplacement._serialMonitor;
    }

    private static _serialMonitor: SerialMonitorReplacement = null;

    private serialMonitorApi: SerialMonitorApi | undefined;
    private extensionContext: vscode.ExtensionContext;
    private currentPort: string;

    private _openPortStatusBar: vscode.StatusBarItem;

    public async initialize(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;
        this.serialMonitorApi = await getSerialMonitorApi(Version.latest, extensionContext);

        this._openPortStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.OPEN_PORT);
        this._openPortStatusBar.command = "arduino.openSerialMonitor";
        this._openPortStatusBar.text = `$(plug)`;
        this._openPortStatusBar.tooltip = "Open Serial Monitor";
        this._openPortStatusBar.show();
    }

    public get initialized(): boolean {
        return !!this.extensionContext;
    }

    public async selectSerialPort(): Promise<string | undefined> {
        const lists = await SerialPortCtrl.list();
        if (!lists.length) {
            vscode.window.showInformationMessage("No serial port is available.");
            return;
        }

        const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>lists.map((l: ISerialPortDetail): vscode.QuickPickItem => {
            return {
                description: l.desc,
                label: l.port,
            };
        }).sort((a, b): number => {
            return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
        }), { placeHolder: "Select a serial port" });

        this.currentPort = chosen.label;
        return chosen ? chosen.label : undefined;
    }

    public async selectBaudRate(): Promise<number | undefined> {
        const rates = SerialMonitorReplacement.listBaudRates();
        const chosen = await vscode.window.showQuickPick(rates.map((rate) => rate.toString()));
        if (!chosen) {
            return undefined;
        }
        if (!parseInt(chosen, 10)) {
            vscode.window.showWarningMessage(`Invalid baud rate, keeping previous baud rate: ${chosen}`);
            return undefined;
        }
        const selectedRate: number = parseInt(chosen, 10);
        return selectedRate;
    }

    public async openSerialMonitor(): Promise<void> {
        if (!this.currentPort) {
            const ans = await vscode.window.showInformationMessage("No serial port was selected, please select a serial port first", "Yes", "No");
            if (ans === "Yes") {
                if (await this.selectSerialPort() === undefined) {
                    return;
                }
            }
            if (!this.currentPort) {
                return;
            }
        }

        const baudRate = await this.selectBaudRate();

        if (!baudRate) {
            return;
        }

        await this.serialMonitorApi.startMonitoringPort({
            port: this.currentPort,
            baudRate,
            lineEnding: LineEnding.None,
            dataBits: 8,
            stopBits: StopBits.One,
            parity: Parity.None,
        })
    }

    public async closeSerialMonitor(port?: string): Promise<boolean> {
        await this.serialMonitorApi.stopMonitoringPort(port ?? this.currentPort);

        // TODO: Update API to return a boolean acknowledging whether monitor session was closed.
        return true;
    }

    public dispose() {
        this.serialMonitorApi.dispose();
    }
}
