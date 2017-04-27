/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

export interface IVscodeSettings {
    arduinoPath: string;
    additionalUrls: string | string[];
    autoUpdateIndexFiles: boolean;
    logLevel: string;
    updateAdditionalUrls(urls: string | string[]): void;
}

export class VscodeSettings implements IVscodeSettings {
    public static getIntance(): IVscodeSettings {
        if (!VscodeSettings._instance) {
            VscodeSettings._instance = new VscodeSettings();
        }
        return VscodeSettings._instance;
    }

    private static _instance: IVscodeSettings;
    private constructor() {
    }

    public get arduinoPath(): string {
        const workspaceConfig = vscode.workspace.getConfiguration();
        return workspaceConfig.get<string>("arduino.path");
    }

    public get additionalUrls(): string {
        const workspaceConfig = vscode.workspace.getConfiguration();
        return workspaceConfig.get<string>("arduino.additionalUrls");
    }

    public async updateAdditionalUrls(value) {
        const workspaceConfig = vscode.workspace.getConfiguration();
        await workspaceConfig.update("arduino.additionalUrls", value, true);
    }

    public get autoUpdateIndexFiles(): boolean {
        const workspaceConfig = vscode.workspace.getConfiguration();
        return workspaceConfig.get<boolean>("arduino.autoUpdateIndexFiles");
    }

    public get logLevel(): string {
        const workspaceConfig = vscode.workspace.getConfiguration();
        return workspaceConfig.get<string>("arduino.logLevel") || "info";
    }
}
