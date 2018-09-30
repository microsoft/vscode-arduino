import * as throttle from "lodash.throttle";
import * as vscode from "vscode";
import * as WebSocket from "ws";

import { SERIAL_PLOTTER_URI } from "../common/constants";
import { SerialPortCtrl } from "./serialportctrl";

interface DataFrame {
    time?: number,
    [field: string]: number,
}

export class SerialPlotter implements vscode.Disposable {
    private _wss: WebSocket.Server;
    private _throttling: number = 100;
    private sendCurrentFrameThrottled;

    private _currentFrame: DataFrame;
    private _lastSentTime: number;

    constructor() {
        this.setThrottling(this._throttling);
        this._currentFrame = {};
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
        this.sendCurrentFrameThrottled = throttle(this.sendCurrentFrame, this._throttling, { leading: false });
    }

    private sendCurrentFrame() {
        if(this._lastSentTime >= this._currentFrame.time) {
            return
        }

        this.sendMessage(this._currentFrame);
        this._lastSentTime = this._currentFrame.time;
        this._currentFrame = {}
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

        this._currentFrame = {
            ...this._currentFrame,
            [field]: parseFloat(value),
            time: parseInt(time),
        }
        
        this.sendCurrentFrameThrottled();
    }
}
