// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as path from "path";

export const isWindows = (process.platform === "win32");
export const isMacintosh = (process.platform === "darwin");
export const isLinux = (process.platform === "linux");

/*tslint:disable:no-var-requires*/
const internalSysLib = require(path.join(__dirname, `sys/${process.platform}`));

export function resolveArduinoPath(): string {
    return internalSysLib.resolveArduinoPath();
}

export function validateArduinoPath(arduinoPath: string, useArduinoCli = false): boolean {
    return internalSysLib.validateArduinoPath(arduinoPath, useArduinoCli);
}

export function findFile(fileName: string, cwd: string): string {
    return internalSysLib.findFile(fileName, cwd);
}

export function getExecutableFileName(fileName: string): string {
    if (isWindows) {
        return `${fileName}.exe`;
    }
    return fileName;
}
