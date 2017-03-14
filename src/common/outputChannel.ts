/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

export const arduinoChannel = {
    channel: vscode.window.createOutputChannel("Arduino"),

    start(message: string) {
        this.channel.appendLine(`[Starting] ${message}`);
    },

    end(message: string) {
        this.channel.appendLine(`[Done] ${message}`);
    },

    error(message: string) {
        this.channel.appendLine(`[Error] ${message}`);
    },

    info(message: string) {
        this.channel.appendLine(message);
    },

    show() {
        this.channel.show();
    },

    hide() {
        this.channel.hide();
    },
};
