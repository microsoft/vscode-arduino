import * as throttle from "lodash.throttle";
import * as vscode from "vscode";
import * as WebSocket from "ws";

import { SERIAL_PLOTTER_URI } from "../common/constants";
import { SerialPortCtrl } from "./serialportctrl";

export class SerialPlotter implements vscode.Disposable {
    private _wss: WebSocket.Server;
    private _throttling: number = 100;
    private sendCurrentStateThrottled;

    private _currentState: {
        time?: number,
        [field: string]: number,
    };

    constructor() {
        this.setThrottling(this._throttling);
    }

    public open() {
        vscode.commands.executeCommand("vscode.previewHtml", SERIAL_PLOTTER_URI, vscode.ViewColumn.Two, "Serial Plotter");
    }

    public dispose() {}

    public setWebSocketServer(wss: WebSocket.Server) {
        this._wss = wss;
    }

    public setSerialPortCtrl(serialPortCtrl: SerialPortCtrl) {
        serialPortCtrl.onData(this.handleSerialData.bind(this));
    }

    public setThrottling(throttling: number): void {
        this._throttling = throttling;
        this.sendCurrentStateThrottled = throttle(this.sendCurrentState, this._throttling, { leading: false });
    }

    private sendCurrentState() {
        if (!this._wss) {
            return;
        }

        this._wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(this._currentState));
            }
        });

        this._currentState = undefined;
    }

    private handleSerialData(line: string): void {
        if (line.length === 0) {
            return;
        }

        if (line.indexOf("PLOT") === -1) {
            return;
        }

        const startIdx = line.indexOf("[");
        const timeDelimeterIdx = line.indexOf(";");
        const endIdx = line.indexOf("]");
        const equalityIdx = line.indexOf("=");

        const timeStr = line.slice(startIdx + 1, timeDelimeterIdx);
        const time = parseInt(timeStr, 10);
        const field = line.slice(timeDelimeterIdx + 1, equalityIdx);
        const valueStr = line.slice(equalityIdx + 1, endIdx);
        const value = parseFloat(valueStr);

        this._currentState = {
            ...this._currentState,
            [field]: value,
            time,
        };

        this.sendCurrentStateThrottled();
    }
}
