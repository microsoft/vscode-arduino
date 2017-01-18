/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import fs = require("fs");
import os = require("os");
import path = require("path");
import vscode = require("vscode");
import childProcess = require("child_process");

export function getCppConfigPlatform(): string {
    const plat = os.platform();
    if (plat === "linux") {
        return "Linux";
    } else if (plat === "darwin") {
        return "Mac";
    } else if (plat === "win32") {
        return "Win32";
    }
}

export function fileExists(filePath: string): boolean {
    try {
        return fs.statSync(filePath).isFile();
    } catch (e) {
        return false;
    }
}

export function directoryExists(path: string): boolean {
    try {
        return fs.statSync(path).isDirectory();
    } catch (e) {
        return false;
    }
}

export function spawn(command: string, outputChannel: vscode.OutputChannel, args: string[] = [], options: any = {}): Thenable<Object> {
    return new Promise((resolve, reject) => {
        let stdout = "";
        let stderr = "";
        options.cwd = options.cwd || path.resolve(path.join(__dirname, ".."));
        const child = childProcess.spawn(command, args, options);

        if (outputChannel) {
            child.stdout.on("data", (data) => { outputChannel.append(data.toString()); });
            child.stderr.on("data", (data) => { outputChannel.append(data.toString()); });
        }

        child.on("error", (error) => reject({ error, stderr, stdout }));

        child.on("exit", (code) => {
            if (code === 0) {
                resolve({ code, stdout, stderr });
            } else {
                reject({ code, stdout, stderr });
            }
        });
    });
}
