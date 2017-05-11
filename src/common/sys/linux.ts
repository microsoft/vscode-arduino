/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as path from "path";
import { fileExistsSync } from "../util";

export function resolveArduinoPath(): string {
    let pathString;
    try {
        pathString = childProcess.execSync("readlink -f $(which arduino)", { encoding: "utf8" });
        pathString = path.resolve(pathString).trim();
        if (fileExistsSync(pathString)) {
            pathString = path.dirname(path.resolve(pathString));
        }
    } catch (ex) {
        // Ignore the errors.
    }

    return pathString || "";
}

export function validateArduinoPath(arduinoPath: string): boolean {
    return fileExistsSync(path.join(arduinoPath, "arduino"));
}

export function findFile(fileName: string, cwd: string): string {
    let pathString;
    try {
        pathString = childProcess.execSync("find ${cwd} -name ${fileName} -type f", { encoding: "utf8" });
        pathString = path.resolve(pathString).trim();

        if (fileExistsSync(pathString)) {
            pathString = path.normalize(pathString);
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return pathString;
}
