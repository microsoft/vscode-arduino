
/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as path from "path";
import { directoryExistsSync, fileExistsSync } from "../util";

export function resolveArduinoPath(): string {
    let result;

    const defaultCommonPaths = [path.join(process.env.HOME, "Applications"), "/Applications"];
    for (const scanPath of defaultCommonPaths) {
        if (directoryExistsSync(path.join(scanPath, "Arduino.app"))) {
            result = scanPath;
            break;
        }
    }
    return result || "";
}

export function validateArduinoPath(arduinoPath: string): boolean {
    return fileExistsSync(path.join(arduinoPath, "Arduino.app/Contents/MacOS/Arduino"));
}

export function findFile(fileName: string, cwd: string): string {
    let pathString;
    try {
        pathString = childProcess.execSync(`find ${cwd} -name ${fileName} -type f`, { encoding: "utf8" }).split("\n");

        if (pathString && pathString[0] && fileExistsSync(pathString[0].trim())) {
            pathString = path.normalize(pathString[0].trim());
        } else {
            pathString = null;
        }
    } catch (ex) {
        // Ignore the errors.
    }
    return pathString;
}
