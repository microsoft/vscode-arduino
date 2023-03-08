// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { getSerialMonitorApi, LineEnding, Parity, Port, PortInformation, SerialMonitorApi, StopBits, Version } from "@microsoft/vscode-serial-monitor-api";
import * as vscode from "vscode";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import * as Logger from "../logger/logger";

export class SerialMonitor implements vscode.Disposable {
    public static DEFAULT_TIMESTAMP_FORMAT: string = "";

    public static listBaudRates(): number[] {
        return [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000];
    }

    public static getInstance(): SerialMonitor {
        if (SerialMonitor._serialMonitor === null) {
            SerialMonitor._serialMonitor = new SerialMonitor();
        }
        return SerialMonitor._serialMonitor;
    }

    private static _serialMonitor: SerialMonitor = null;

    private serialMonitorApi: SerialMonitorApi | undefined;
    private extensionContext: vscode.ExtensionContext;
    private currentPort: string;
    private activePort: Port | undefined;
    private lastSelectedBaudRate: number = 115200; // Same default as Arduino.

    private openPortStatusBar: vscode.StatusBarItem;
    private portsStatusBar: vscode.StatusBarItem;
    private timestampFormatStatusBar: vscode.StatusBarItem;

    public async initialize(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;

        this.portsStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.PORT);
        this.portsStatusBar.command = "arduino.selectSerialPort";
        this.portsStatusBar.tooltip = "Select Serial Port";
        this.portsStatusBar.show();

        this.openPortStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.OPEN_PORT);
        this.openPortStatusBar.command = "arduino.openSerialMonitor";
        this.openPortStatusBar.text = `$(plug)`;
        this.openPortStatusBar.tooltip = "Open Serial Monitor";
        this.openPortStatusBar.show();

        // This statusbar button will open the timestamp format setting in the serial monitor extension.
        this.timestampFormatStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,
                                                                           constants.statusBarPriority.TIMESTAMP_FORMAT);
        this.timestampFormatStatusBar.command = "arduino.changeTimestampFormat";
        this.timestampFormatStatusBar.tooltip = `Change timestamp format`;
        this.timestampFormatStatusBar.text = `$(watch)`;

        this.updatePortListStatus();

        const dc = DeviceContext.getInstance();
        dc.onChangePort(() => {
            this.updatePortListStatus();
        });

        this.serialMonitorApi = await getSerialMonitorApi(Version.latest, extensionContext);

        this.checkForUndefinedSerialMonitorApi();
    }

    public get initialized(): boolean {
        return !!this.extensionContext;
    }

    public async selectSerialPort(): Promise<string | undefined> {
        this.checkForUndefinedSerialMonitorApi(true);

        const ports = await this.serialMonitorApi.listAvailablePorts();
        if (!ports.length) {
            vscode.window.showInformationMessage("No serial port is available.");
            return;
        }

        const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>ports.map((l: PortInformation): vscode.QuickPickItem => {
            return {
                description: l.friendlyName,
                label: l.portName,
            };
        }).sort((a, b): number => {
            return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
        }), { placeHolder: "Select a serial port" });

        if (chosen && chosen.label) {
            this.currentPort = chosen.label;
            this.updatePortListStatus(this.currentPort);
            return chosen.label;
        }

        return undefined;
    }

    public async changeTimestampFormat(): Promise<void> {
        await vscode.commands.executeCommand("workbench.action.openSettings", "vscode-serial-monitor.timestampFormat");
    }

    public async selectBaudRate(): Promise<number | undefined> {
        const rates = SerialMonitor.listBaudRates();
        const chosen = await vscode.window.showQuickPick(rates.map((rate) => rate.toString()));
        if (!chosen) {
            Logger.warn("No baud rate selected, keeping previous baud rate");
            return undefined;
        }
        if (!parseInt(chosen, 10)) {
            Logger.warn("Serial Monitor has not been started");
            return undefined;
        }
        const selectedRate: number = parseInt(chosen, 10);
        this.lastSelectedBaudRate = selectedRate;
        return selectedRate;
    }

    public async openSerialMonitor(restore: boolean = false): Promise<void> {
        this.checkForUndefinedSerialMonitorApi(true);

        if (!this.currentPort) {
            const ans = await vscode.window.showInformationMessage("No serial port was selected, please select a serial port first", "Select", "Cancel");
            if (ans === "Select") {
                if (await this.selectSerialPort() === undefined) {
                    return;
                }
            }
            if (!this.currentPort) {
                return;
            }
        }

        // if we're restoring, we want to use the most recent baud rate selected, rather than popping UI.
        const baudRate = restore ? this.lastSelectedBaudRate : await this.selectBaudRate() ?? this.lastSelectedBaudRate;

        try {
            this.activePort = await this.serialMonitorApi.startMonitoringPort({
                port: this.currentPort,
                baudRate,
                lineEnding: LineEnding.None,
                dataBits: 8,
                stopBits: StopBits.One,
                parity: Parity.None,
            });
            this.activePort.onClosed(() => {
                this.updatePortStatus(false);
                this.activePort = undefined;
            });
            this.updatePortStatus(true);
        } catch (err) {
            Logger.warn("Serial Monitor failed to open");
            if (err.message) {
                vscode.window.showErrorMessage(`Error opening serial port: ${err.message}`);
            }
        }
    }

    public async closeSerialMonitor(port?: string): Promise<boolean> {
        this.checkForUndefinedSerialMonitorApi(true);

        const portToClose = port ?? this.currentPort;
        let closed = false;
        if (portToClose) {
            closed = await this.serialMonitorApi.stopMonitoringPort(port ?? this.currentPort);
        }
        this.updatePortStatus(false);

        return closed;
    }

    public dispose() {
        this.serialMonitorApi.dispose();
    }

    private checkForUndefinedSerialMonitorApi(showError: boolean = false): void {
        const errorString = "Serial Monitor API was not retrieved. You may not have the most recent version of the Serial Monitor extension installed.";
        if (this.serialMonitorApi === undefined) {
            if (showError) {
                Logger.notifyUserError("UndefinedSerialMonitorApi", new Error(errorString));
            } else {
                Logger.traceError("UndefinedSerialMonitorApi", new Error(errorString));
            }
        }
    }

    private updatePortListStatus(port?: string) {
        const dc = DeviceContext.getInstance();
        if (port) {
            dc.port = port;
        }
        this.currentPort = dc.port;

        if (dc.port) {
            this.portsStatusBar.text = dc.port;
        } else {
            this.portsStatusBar.text = "<Select Serial Port>";
        }
    }

    private updatePortStatus(isOpened: boolean) {
        if (isOpened) {
            this.openPortStatusBar.command = "arduino.closeSerialMonitor";
            this.openPortStatusBar.text = `$(x)`;
            this.openPortStatusBar.tooltip = "Close Serial Monitor";
            this.timestampFormatStatusBar.show();
        } else {
            this.openPortStatusBar.command = "arduino.openSerialMonitor";
            this.openPortStatusBar.text = `$(plug)`;
            this.openPortStatusBar.tooltip = "Open Serial Monitor";
            this.timestampFormatStatusBar.hide();
        }
    }
}
