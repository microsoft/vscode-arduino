/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { directoryExistsSync, fileExistsSync } from "./util";

export const isWindows = (process.platform === "win32");
export const isMacintosh = (process.platform === "darwin");
export const isLinux = (process.platform === "linux");

export function resolveArduinoPath(): string {
    let result;
    try {
        // Resolve arduino path from system environment variables.
        if (isWindows) {
            let pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
            pathString = path.resolve(pathString).trim();
            if (fileExistsSync(pathString)) {
                result = path.dirname(path.resolve(pathString));
            }
        } else if (isLinux) {
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
        if (isMacintosh) {
            const defaultCommonPaths = [path.join(process.env.HOME, "Applications"), "/Applications"];
            for (const scanPath of defaultCommonPaths) {
                if (directoryExistsSync(path.join(scanPath, "Arduino.app"))) {
                    result = scanPath;
                    break;
                }
            }
        } else if (isLinux) {
            // TODO
        } else if (isWindows) {
            const defaultCommonPaths = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]];
            for (const scanPath of defaultCommonPaths) {
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
    try {
        if (isWindows) {
            result = childProcess.execSync(`where ${appName}`, { encoding: "utf8" });
        } else if (isLinux || isMacintosh) {
            result = childProcess.execSync(`which ${appName}`, { encoding: "utf8" });
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return result;
}

export function validateArduinoPath(arduinoPath: string): boolean {
    let arduinoExe = "";
    if (isMacintosh) {
        arduinoExe = path.join(arduinoPath, "Arduino.app/Contents/MacOS/Arduino");
    } else if (isLinux) {
        arduinoExe = path.join(arduinoPath, "arduino");
    } else if (isWindows) {
        arduinoExe = path.join(arduinoPath, "arduino_debug.exe");
    }
    return fileExistsSync(arduinoExe);
}

export function findFile(fileName: string, cwd: string): string {
    let result;
    try {
        let pathString;
        if (isWindows) {
            pathString = childProcess.execSync(`dir ${fileName} /S /B`, { encoding: "utf8", cwd });
            pathString = path.resolve(pathString).trim();
        } else if (isLinux || isMacintosh) {
            pathString = childProcess.execSync("find ${cwd} -name ${fileName} -type f", { encoding: "utf8" });
            pathString = path.resolve(pathString).trim();
        }

        if (fileExistsSync(pathString)) {
            result = path.normalize(pathString);
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return result;
}
