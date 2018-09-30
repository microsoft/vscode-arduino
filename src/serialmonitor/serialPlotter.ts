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
        this._currentState = {};
    }

    public open() {
        vscode.commands.executeCommand("vscode.previewHtml", SERIAL_PLOTTER_URI, vscode.ViewColumn.Two, "Serial Plotter");
    }

    public reset() {
        this.sendMessage({action: 'RESET'});
    }

    public dispose() {}

    public setWebSocketServer(wss: WebSocket.Server) {
        this._wss = wss;
    }

    public setSerialPortCtrl(serialPortCtrl: SerialPortCtrl) {
        serialPortCtrl.onLine(this.handleSerialLine.bind(this));
    }

    public setThrottling(throttling: number): void {
        this._throttling = throttling;
        this.sendCurrentStateThrottled = throttle(this.sendCurrentState, this._throttling, { leading: false });
    }

    private sendCurrentState() {
        this.sendMessage(this._currentState);
    }

    private sendMessage(msg: {}) {
        if (!this._wss) {
            return;
        }

        this._wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(msg));
            }
        });
    }

    private handleSerialLine(line: string): void {
        const match = line.match(/^PLOT\[(\d+)\]\[(.+?)=(.+?)\]/)

        if (!match) {
            return;
        }

        const [, time, field, value] = match

        this._currentState.time = parseInt(time)
        this._currentState[field] = parseFloat(value)
        
        this.sendCurrentStateThrottled();
    }
}
