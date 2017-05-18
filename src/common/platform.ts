/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/
import * as path from "path";
import { directoryExistsSync, fileExistsSync } from "./util";

export const isWindows = (process.platform === "win32");
export const isMacintosh = (process.platform === "darwin");
export const isLinux = (process.platform === "linux");

/*tslint:disable:no-var-requires*/
const internalSysLib = require(path.join(__dirname, `sys/${process.platform}`));

export function resolveArduinoPath(): string {
    return internalSysLib.resolveArduinoPath();
}

export function validateArduinoPath(arduinoPath: string): boolean {
    return internalSysLib.validateArduinoPath(arduinoPath);
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
