// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

const configKeys = {
    ARDUINO_PATH: "arduino.path",
    ADDITIONAL_URLS: "arduino.additionalUrls",
    LOG_LEVEL: "arduino.logLevel",
    AUTO_UPDATE_INDEX_FILES: "arduino.autoUpdateIndexFiles",
    BUILDER: "arduino.builder",
    VERIFY_COMMAND: "arduino.verifyCommand",
    UPLOAD_COMMAND: "arduino.uploadCommand",
};

export interface IVscodeSettings {
    arduinoPath: string;
    additionalUrls: string | string[];
    logLevel: string;
    builder: string;
    verifyCommand: string;
    uploadCommand: string;
    updateAdditionalUrls(urls: string | string[]): void;
}

export class VscodeSettings implements IVscodeSettings {
    public static getInstance(): IVscodeSettings {
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

    public get logLevel(): string {
        return this.getConfigValue<string>(configKeys.LOG_LEVEL) || "info";
    }

    public async updateAdditionalUrls(value) {
        await this.setConfigValue(configKeys.ADDITIONAL_URLS, value, true);
    }

    public get builder(): string {
        return this.getConfigValue(configKeys.BUILDER) || "arduinoIDE";
    }

    public get verifyCommand(): string {
        return this.getConfigValue(configKeys.VERIFY_COMMAND) || "make";
    }

    public get uploadCommand(): string {
        return this.getConfigValue(configKeys.UPLOAD_COMMAND) || "make upload";
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
