/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import { directoryExistsSync, fileExistsSync } from "./util";

export function resolveArduinoPath(): string {
    let result;
    const plat = os.platform();
    try {
        // Resolve arduino path from system environment variables.
        if (plat === "win32") {
            let pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
            pathString = path.resolve(pathString).trim();
            if (fileExistsSync(pathString)) {
                result = path.dirname(path.resolve(pathString));
            }
        } else if (plat === "linux") {
            let pathString = childProcess.execSync("readlink -f $(which arduino)", { encoding: "utf8" });
            pathString = path.resolve(pathString).trim();
            if (fileExistsSync(pathString)) {
                result = path.dirname(path.resolve(pathString));
            }
        }
    } catch (ex) {
        // Ignore the errors.
    }

    // Resolve arduino path from the usual software installation directory for each os.
    // For example, "C:\Program Files" for Windows, "/Applications" for Mac.
    if (!result) {
        if (plat === "darwin") {
            const defaultCommonPaths = [path.join(process.env.HOME, "Applications"), "/Applications"];
            for (let scanPath of defaultCommonPaths) {
                if (directoryExistsSync(path.join(scanPath, "Arduino.app"))) {
                    result = scanPath;
                    break;
                }
            }
        } else if (plat === "linux") {
            // TODO
        } else if (plat === "win32") {
            const defaultCommonPaths = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]];
            for (let scanPath of defaultCommonPaths) {
                if (scanPath && directoryExistsSync(path.join(scanPath, "Arduino"))) {
                    result = path.join(scanPath, "Arduino");
                    break;
                }
            }
        }
    }

    return result || "";
}

export function detectApp(appName: string): boolean {
    let result;
    const plat = os.platform();
    try {
        if (plat === "win32") {
            result = childProcess.execSync(`where ${appName}`, { encoding: "utf8" });
        } else if (plat === "linux" || plat === "darwin") {
            result = childProcess.execSync(`which ${appName}`, { encoding: "utf8" });
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return result;
}

export function validateArduinoPath(arduinoPath: string): boolean {
    const platform = os.platform();
    let arduinoExe = "";
    if (platform === "darwin") {
        arduinoExe = path.join(arduinoPath, path.normalize("Arduino.app/Contents/MacOS/Arduino"));
    } else if (platform === "linux") {
        arduinoExe = path.join(this.arduinoPath, "arduino");
    } else if (platform === "win32") {
        arduinoExe = path.join(this.arduinoPath, "arduino_debug.exe");
    }
    return fileExistsSync(arduinoExe);
}
