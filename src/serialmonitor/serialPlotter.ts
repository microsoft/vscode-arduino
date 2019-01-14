import * as throttle from "lodash.throttle";
import * as vscode from "vscode";

import { VscodeSettings } from "../arduino/vscodeSettings";
import { SerialPortCtrl } from "./serialportctrl";

interface IDataFrame {
    time?: number;
    [field: string]: number;
}

type ISendMessage = (message: {}) => void;

export class SerialPlotter implements vscode.Disposable {
    private _sendMessage: ISendMessage;
    private _throttling: number = 100;
    private sendCurrentFrameThrottled;

    private _currentFrame: IDataFrame;
    private _lastSentTime: number;

    constructor() {
        this.setThrottling(this._throttling);
        this._currentFrame = {};
    }

    public open() {
        vscode.commands.executeCommand("arduino.showSerialPlotter");
    }

    public reset() {
        this.sendMessage({action: "RESET"});
    }

    public dispose() {
    }

    public setSendMessageFn(sendMessage: ISendMessage) {
        this._sendMessage = sendMessage;
    }

    public setSerialPortCtrl(serialPortCtrl: SerialPortCtrl) {
        serialPortCtrl.onLine(this.handleSerialLine.bind(this));
    }

    public setThrottling(throttling: number): void {
        this._throttling = throttling;
        this.sendCurrentFrameThrottled = throttle(this.sendCurrentFrame, this._throttling, { leading: false });
    }

    private sendCurrentFrame() {
        if (this._lastSentTime >= this._currentFrame.time) {
            return;
        }

        this.sendMessage(this._currentFrame);
        this._lastSentTime = this._currentFrame.time;
        this._currentFrame = {};
    }

    private sendMessage(msg: {}) {
        if (!this._sendMessage) {
            return;
        }

        this._sendMessage(msg);
    }

    private handleSerialLine(line: string): void {
        const match = line.match(new RegExp(VscodeSettings.getInstance().plotRegex));

        if (!match) {
            return;
        }

        const [, time, field, value] = match;

        this._currentFrame = {
            ...this._currentFrame,
            [field]: parseFloat(value),
            time: parseInt(time, 10),
        };

        this.sendCurrentFrameThrottled();
    }
}
