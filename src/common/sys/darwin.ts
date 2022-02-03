// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as childProcess from "child_process";
import * as path from "path";
import { directoryExistsSync, fileExistsSync, resolveMacArduinoAppPath } from "../util";

export function resolveArduinoPath(useArduinoCli = false): string {
    let result;

    const appName = useArduinoCli ? 'arduino-cli' : 'Arduino.app'
    const defaultCommonPaths = [path.join(process.env.HOME, "Applications"), "/Applications", '/opt/homebrew/bin'];
    for (const scanPath of defaultCommonPaths) {
        if (directoryExistsSync(path.join(scanPath, appName))) {
            result = scanPath;
            break;
        }
    }
    if(!result) {
        result = which(appName);
    }
    return result || "";
}

export function validateArduinoPath(arduinoPath: string, useArduinoCli = false): boolean {
    let fileExists = fileExistsSync(path.join(resolveMacArduinoAppPath(arduinoPath, useArduinoCli), useArduinoCli 
        ? "arduino-cli" : 
          "/Contents/MacOS/Arduino"));
    return fileExists;
}

function which(programName: string) {
    let location = childProcess.execSync(`which ${programName}`, { encoding: "utf8" }).trim();
    if(location ===  `${programName} not found`) {
        return undefined;
    }
    return location.substring(0, location.length - programName.length);
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
