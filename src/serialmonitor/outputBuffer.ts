// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

export class BufferedOutputChannel implements vscode.Disposable {
    private TIMING_BUFFER: number = 300;

    private _buffer: string[];
    private timer:  NodeJS.Timer;

    public constructor(private outputCallback: (value: string) => void) {
        this._buffer = [];
        this.timer = setInterval(() => this.flush(), this.TIMING_BUFFER);
    }

    private add(value: string) {
        this._buffer.push(value);
    }

    private flush() {
        if (this._buffer && this._buffer.length > 0) {
            this.outputCallback(this._buffer.join(''));
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