// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as childProcess from "child_process";
import * as path from "path";
import * as WinReg from "winreg";
import { directoryExistsSync, fileExistsSync, getRegistryValues } from "../util";

export async function resolveArduinoPath() {
    // eslint-disable-next-line no-prototype-builtins
    const isWin64 = process.arch === "x64" || process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432");
    let pathString = await getRegistryValues(WinReg.HKLM,
        isWin64 ? "\\SOFTWARE\\WOW6432Node\\Arduino" : "\\SOFTWARE\\Arduino",
        "Install_Dir");
    if (directoryExistsSync(pathString)) {
        return pathString;
    }
    try {
        pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
        pathString = path.resolve(pathString).trim();
        if (fileExistsSync(pathString)) {
            pathString = path.dirname(path.resolve(pathString));
        }
    } catch (error) {
        // when "where arduino"" execution fails, the childProcess.execSync will throw error, just ignore it
    }

    return pathString;
}

export function validateArduinoPath(arduinoPath: string, useArduinoCli = false): boolean {
    return fileExistsSync(path.join(arduinoPath, useArduinoCli ? "arduino-cli.exe" : "arduino_debug.exe"));

}

export function findFile(fileName: string, cwd: string): string {
    let result;
    try {
        const pathString = childProcess.execSync(`dir ${fileName} /S /B`, { encoding: "utf8", cwd }).split("\n");
        if (pathString && pathString[0] && fileExistsSync(pathString[0].trim())) {
            result = path.normalize(pathString[0].trim());
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return result;
}
