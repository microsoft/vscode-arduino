// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { performance } from "perf_hooks";

export class BufferedOutputChannel implements vscode.Disposable {
    private TIMING_BUFFER: number = 300;

    private _buffer: string[];
    private timer:  NodeJS.Timer;
    private _lastFlushTime: number;

    public constructor(private outputCallback: (value: string) => void) {
        this._buffer = [];
        this.timer = setInterval(() => this.tryFlush(), this.TIMING_BUFFER);
        this._lastFlushTime = Number.NEGATIVE_INFINITY;
    }

    private add(value: string) {
        this._buffer.push(value);
        this.tryFlush();
    }

    private tryFlush() {
        const currentTime = performance.now();
        if (this._buffer && this._buffer.length > 0 && currentTime-this._lastFlushTime > this.TIMING_BUFFER) {
            this.outputCallback(this._buffer.join(''));
            this._lastFlushTime = currentTime;
            this._buffer = [];
        }
    }

    public append(value: string) {
        this.add(value);
    }

    public appendLine(value: string) {
        this.add(value + '\n');
    }

    dispose() {
        clearInterval(this.timer);
    }
}