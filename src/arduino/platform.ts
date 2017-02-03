/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import { fileExists } from "../common/util";

export function resolveArduinoPath(arduino: string): string {
    let result = arduino;
    const plat = os.platform();
    if (plat === "win32") {
        let pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
        pathString = path.resolve(pathString).trim();
        if (!fileExists(pathString)) {
            vscode.window.showErrorMessage("Cannot find the Arduino installation folder.");
        } else {
            result = path.dirname(path.resolve(pathString));
        }
    }
    // TODO: Add path resolve on Ubuntu and Mac OS platforms.
    return result;
}
