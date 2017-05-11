/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as path from "path";
import { fileExistsSync } from "../util";

export function resolveArduinoPath() {
    let pathString = childProcess.execSync("where arduino", { encoding: "utf8" });
    pathString = path.resolve(pathString).trim();
    if (fileExistsSync(pathString)) {
        pathString = path.dirname(path.resolve(pathString));
    }
    return pathString;
}

export function validateArduinoPath(arduinoPath: string): boolean {
    return fileExistsSync(path.join(arduinoPath, "arduino_debug.exe"));
}

export function findFile(fileName: string, cwd: string): string {
    let result;
    try {
        let pathString;
        pathString = childProcess.execSync(`dir ${fileName} /S /B`, { encoding: "utf8", cwd });
        pathString = path.resolve(pathString).trim();

        if (fileExistsSync(pathString)) {
            result = path.normalize(pathString);
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return result;
}
