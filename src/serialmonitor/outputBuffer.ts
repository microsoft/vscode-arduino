// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { performance } from "perf_hooks";
import * as vscode from "vscode";

export class BufferedOutputChannel implements vscode.Disposable {
    private _buffer: string[];
    private _timer: NodeJS.Timer;
    private _lastFlushTime: number;

    public constructor(private readonly outputCallback: (value: string) => void, private readonly flushIntervalMs: number) {
        this._buffer = [];
        this._timer = setInterval(() => this.tryFlush(), this.flushIntervalMs);
        this._lastFlushTime = Number.NEGATIVE_INFINITY;
    }

    public append(value: string) {
        this.add(value);
    }

    public appendLine(value: string) {
        this.add(value + "\n");
    }

    public dispose() {
        this.tryFlush();
        clearInterval(this._timer);
    }

    private add(value: string) {
        this._buffer.push(value);
        this.tryFlush();
    }

    private tryFlush() {
        const currentTime = performance.now();
        if (this._buffer.length > 0 && currentTime - this._lastFlushTime > this.flushIntervalMs) {
            this.outputCallback(this._buffer.join(""));
            this._lastFlushTime = currentTime;
            this._buffer = [];
        }
    }
}
