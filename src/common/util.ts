/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as properties from "properties";
import * as vscode from "vscode";
import Telemetry from '../applicationInsight/Telemetry'

/**
 * This function will return the VSCode C/C++ extesnion compatible platform literals.
 * @function getCppConfigPlatform
 */
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

/**
 * This function will detect the file existing in the sync mode.
 * @function fileExistsSync
 * @argument {string} filePath
 */
export function fileExistsSync(filePath: string): boolean {
    try {
        return fs.statSync(filePath).isFile();
    } catch (e) {
        return false;
    }
}

/**
 * This function will detect the directoy existing in the sync mode.
 * @function directoryExistsSync
 * @argument {string} dirPath
 */
export function directoryExistsSync(dirPath: string): boolean {
    try {
        return fs.statSync(dirPath).isDirectory();
    } catch (e) {
        return false;
    }
}

/**
 * Recursively delete files. Equals to "rm -rf"
 * @function rmdirRecursivelySync
 * @argument {string} rootPath
 */
export function rmdirRecursivelySync(rootPath: string): void {
    if (fs.existsSync(rootPath)) {
        fs.readdirSync(rootPath).forEach((file) => {
            let curPath = path.join(rootPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                rmdirRecursivelySync(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(rootPath);
    }
}

export function spawn(command: string, outputChannel: vscode.OutputChannel, args: string[] = [], options: any = {}): Thenable<Object> {
    return new Promise((resolve, reject) => {
        let timer: Telemetry.TelemetryTimer = new Telemetry.TelemetryTimer();
        let stdout = "";
        let stderr = "";
        options.cwd = options.cwd || path.resolve(path.join(__dirname, ".."));
        const child = childProcess.spawn(command, args, options);

        if (outputChannel) {
            child.stdout.on("data", (data) => { outputChannel.append(data.toString()); });
            child.stderr.on("data", (data) => { outputChannel.append(data.toString()); stderr += data.toString(); });
        }

        child.on("error", (error) => reject({ error, stderr, stdout }));

        child.on("exit", (code) => {
            if (code === 0) {
                // begin of telemetry trace
                Telemetry.sendTelemetryEvent("spawnSuccess", {
                    command: command,
                    args1: (args && args.length) ? args[0] : null,
                    args2: (args && args.length > 1) ? args[1] : null
                }, {                    
                    duration: timer.end()
                });
                // end of telemetry trace
                
                resolve({ code, stdout, stderr });
            } else {
                // begin of telemetry trace
                Telemetry.sendTelemetryEvent("spawnError", {
                    command: command,
                    args1: (args && args.length) ? args[0] : null,
                    args2: (args && args.length > 1) ? args[1] : null,
                    error: stderr
                }, {
                    duration: timer.end(),
                    code: code
                });
                // end of telemetry trace

                reject({ code, stdout, stderr });
            }
        });
    });
}

export function tryParseJSON(jsonString: string) {
    try {
        const jsonObj = JSON.parse(jsonString);
        if (jsonObj && typeof jsonObj === "object") {
            return jsonObj;
        }
    } catch (ex) { }

    return false;
}

export function isJunk(filename: string): boolean {
    // tslint:disable-next-line
    const re = /^npm-debug\.log$|^\..*\.swp$|^\.DS_Store$|^\.AppleDouble$|^\.LSOverride$|^Icon\r$|^\._.*|^\.Spotlight-V100(?:$|\/)|\.Trashes|^__MACOSX$|~$|^Thumbs\.db$|^ehthumbs\.db$|^Desktop\.ini$/;
    return re.test(filename);
}

export function filterJunk(files: any[]): any[] {
    return files.filter((file) => !isJunk(file));
}

export function parseProperties(propertiesFile: string): Thenable<Object> {
    return new Promise((resolve, reject) => {
        properties.parse(propertiesFile, { path: true }, (error, obj) => {
            if (error) {
                reject(error);
            } else {
                resolve(obj);
            }
        });
    });
}

export function formatVersion(version: string): string {
    if (!version) {
        return version;
    }
    const versions = String(version).split(".");
    if (versions.length < 2) {
        versions.push("0");
    }
    if (versions.length < 3) {
        versions.push("0");
    }
    return versions.join(".");
}
