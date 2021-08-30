// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as childProcess from "child_process";
import * as path from "path";
import { directoryExistsSync, fileExistsSync, resolveMacArduinoAppPath } from "../util";

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

export function validateArduinoPath(arduinoPath: string, useArduinoCli = false): boolean {
    return fileExistsSync(path.join(resolveMacArduinoAppPath(arduinoPath, useArduinoCli), useArduinoCli ? "arduino-cli" : "/Contents/MacOS/Arduino"));
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
