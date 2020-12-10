// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

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

export function validateArduinoPath(arduinoPath: string, useArduinoCli = false): boolean {
    return fileExistsSync(path.join(arduinoPath, useArduinoCli ? "arduino-cli" : "arduino"));
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
