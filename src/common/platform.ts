/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as constants from "../common/constants";
import * as Logger from "../logger/logger";
import { fileExistsSync } from "./util";

export function resolveArduinoPath(): string {
    let result;
    const plat = os.platform();
    try {
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
    if (!result) {
        Logger.notifyUserError(constants.messages.INVALID_ARDUINO_PATH, new Error(constants.messages.INVALID_ARDUINO_PATH));
    }
    return result;
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
