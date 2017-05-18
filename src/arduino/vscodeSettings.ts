/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

const configKeys = {
    ARDUINO_PATH: "arduino.path",
    ADDITIONAL_URLS: "arduino.additionalUrls",
    LOG_LEVEL: "arduino.logLevel",
    AUTO_UPDATE_INDEX_FILES: "arduino.autoUpdateIndexFiles",
};

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
        return this.getConfigValue<string>(configKeys.ARDUINO_PATH);
    }

    public get additionalUrls(): string | string[] {
        return this.getConfigValue<string | string[]>(configKeys.ADDITIONAL_URLS);
    }

    public get autoUpdateIndexFiles(): boolean {
        return this.getConfigValue<boolean>(configKeys.AUTO_UPDATE_INDEX_FILES);
    }

    public get logLevel(): string {
        return this.getConfigValue<string>(configKeys.LOG_LEVEL) || "info";
    }

    public async updateAdditionalUrls(value) {
        await this.setConfigValue(configKeys.ADDITIONAL_URLS, value, true);
    }

    private getConfigValue<T>(key: string): T {
        const workspaceConfig = vscode.workspace.getConfiguration();
        return workspaceConfig.get<T>(key);
    }

    private async setConfigValue(key: string, value, global: boolean = true) {
        const workspaceConfig = vscode.workspace.getConfiguration();
        await workspaceConfig.update(key, value, global);
    }
}
