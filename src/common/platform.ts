/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as Registry from "winreg";
import { directoryExistsSync, fileExistsSync } from "./util";
function _listRegKey(key, subkey, itemName): Promise<string> {
    const regKey = new Registry({ hive: key, key: subkey });
    return new Promise((resolve, reject) => {
        regKey.values((err, items) => {
            if (err) {
                // console.log(err);
                resolve(undefined);
            } else {
                for (const item of items) {
                    if (item.name === itemName) {
                        resolve(item.value);
                        break;
                    }
                }
            }
        });
    });
};
export async function resolveArduinoPath(): Promise<string> {
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
            for (const scanPath of defaultCommonPaths) {
                if (directoryExistsSync(path.join(scanPath, "Arduino.app"))) {
                    result = scanPath;
                    break;
                }
            }
        } else if (plat === "linux") {
            // TODO
        } else if (plat === "win32") {
            const defaultCommonPaths = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]];
            for (const scanPath of defaultCommonPaths) {
                if (scanPath && directoryExistsSync(path.join(scanPath, "Arduino"))) {
                    result = path.join(scanPath, "Arduino");
                    break;
                }
            }
        }
    }
    if (!result) {
        const win64 = (os.platform() === "win32" && (process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432")));
        const arduinoRegistryPath = await _listRegKey(Registry.HKLM,
            win64 ? "\\SOFTWARE\\WOW6432Node\\Arduino" : "\\SOFTWARE\\Arduino", "Install_Dir");
        if (directoryExistsSync(arduinoRegistryPath)) {
            result = arduinoRegistryPath;
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
        arduinoExe = path.join(arduinoPath, "Arduino.app/Contents/MacOS/Arduino");
    } else if (platform === "linux") {
        arduinoExe = path.join(arduinoPath, "arduino");
    } else if (platform === "win32") {
        arduinoExe = path.join(arduinoPath, "arduino_debug.exe");
    }
    return fileExistsSync(arduinoExe);
}
