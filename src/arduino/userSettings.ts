/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

export interface IUserSettings {
    arduinoPath: string;
    additionalUrls: string | string[];
    autoUpdateIndexFiles: boolean;
    logLevel: string;
    formatterSettings: IClangFormatterSettings;
    updateAdditionalUrls(urls: string | string[]): void;
}

export interface IClangFormatterSettings {
    style: string;
}

export class UserSettings implements IUserSettings {
    public static getIntance(): IUserSettings {
        if (!UserSettings._instance) {
            UserSettings._instance = new UserSettings();
        }
        return UserSettings._instance;
    }

    private static _instance: IUserSettings;
    private _clangFormatterSettings: IClangFormatterSettings;

    private constructor() {
        this.loadClangFormatterSettings();
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

    public get formatterSettings(): IClangFormatterSettings {
        return this._clangFormatterSettings;
    }

    private loadClangFormatterSettings() {
        const workspaceConfig = vscode.workspace.getConfiguration();
        this._clangFormatterSettings = {
            style: workspaceConfig.get<string>("arduino.clangFormatStyle"),
        };
    }
}
