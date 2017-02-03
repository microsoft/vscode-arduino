/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import { fileExists } from "../common/util";

export function resolveArduinoPath(): string {
    let result;
    const plat = os.platform();
    try {
        if (plat === "win32") {
            let pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
            pathString = path.resolve(pathString).trim();
            if (fileExists(pathString)) {
                result = path.dirname(path.resolve(pathString));
            }
        }
    } catch (ex) {
        // Ignore the errors.
    }
    if (!result) {
        vscode.window.showErrorMessage("Cannot find the Arduino installation path. You can specify the path in the user settings.");
    }
    // TODO: Add path resolve on Ubuntu and Mac OS platforms.
    return result;
}
