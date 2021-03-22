// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ARDUINO_CONFIG_FILE } from "./constants";

export class ArduinoWorkspace {
    static get rootPath(): string|undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }

        for (const workspaceFolder of workspaceFolders) {
            const workspaceFolderPath = workspaceFolder.uri.fsPath;
            const arduinoConfigPath = path.join(workspaceFolderPath, ARDUINO_CONFIG_FILE);
            if (fs.existsSync(arduinoConfigPath)) {
                return workspaceFolderPath;
            }
        }

        return workspaceFolders[0].uri.fsPath;
    }
}
