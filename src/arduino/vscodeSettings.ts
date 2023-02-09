// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { toStringArray } from "../common/util";

const configKeys = {
    ARDUINO_PATH: "arduino.path",
    ARDUINO_COMMAND_PATH: "arduino.commandPath",
    ADDITIONAL_URLS: "arduino.additionalUrls",
    LOG_LEVEL: "arduino.logLevel",
    CLEAR_OUTPUT_ON_START: "arduino.clearOutputOnBuild",
    AUTO_UPDATE_INDEX_FILES: "arduino.autoUpdateIndexFiles",
    ALLOW_PDE_FILETYPE: "arduino.allowPDEFiletype",
    ENABLE_USB_DETECTION: "arduino.enableUSBDetection",
    DISABLE_TESTING_OPEN: "arduino.disableTestingOpen",
    IGNORE_BOARDS: "arduino.ignoreBoards",
    SKIP_HEADER_PROVIDER: "arduino.skipHeaderProvider",
    USE_ARDUINO_CLI: "arduino.useArduinoCli",
    DISABLE_INTELLISENSE_AUTO_GEN: "arduino.disableIntelliSenseAutoGen",
    ANALYZE_ON_OPEN: "arduino.analyzeOnOpen",
    ANALYZE_ON_SETTING_CHANGE: "arduino.analyzeOnSettingChange",
};

export interface IVscodeSettings {
    arduinoPath: string;
    commandPath: string;
    additionalUrls: string[];
    logLevel: string;
    clearOutputOnBuild: boolean;
    allowPDEFiletype: boolean;
    enableUSBDetection: boolean;
    disableTestingOpen: boolean;
    ignoreBoards: string[];
    skipHeaderProvider: boolean;
    useArduinoCli: boolean;
    disableIntelliSenseAutoGen: boolean;
    analyzeOnOpen: boolean;
    analyzeOnSettingChange: boolean;
    updateAdditionalUrls(urls: string[]): void;
    setUseArduinoCli(value: boolean): Promise<void>;
    setArduinoPath(value: string): Promise<void>;
    setCommandPath(value: string): Promise<void>;
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

    public setArduinoPath(value: string): Promise<void> {
        return this.setConfigValue(configKeys.ARDUINO_PATH, value, true);
    }

    public get commandPath(): string {
        return this.getConfigValue<string>(configKeys.ARDUINO_COMMAND_PATH);
    }

    public setCommandPath(value: string): Promise<void> {
        return this.setConfigValue(configKeys.ARDUINO_COMMAND_PATH, value, true);
    }

    public get additionalUrls(): string[] {
        const value = this.getConfigValue<string | string[]>(configKeys.ADDITIONAL_URLS);

        // Even though the schema says value must be a string array, version
        // 0.4.9 and earlier also allowed a single comma delimeted string. We
        // continue to unofficially support that format to avoid breaking
        // existing settings, but we immediately write back the correctly
        // formatted version.
        const split = toStringArray(value);
        if (typeof value === "string") {
            this.updateAdditionalUrls(split);
        }

        return split;
    }

    public get logLevel(): string {
        return this.getConfigValue<string>(configKeys.LOG_LEVEL) || "info";
    }

    public get clearOutputOnBuild(): boolean {
        return this.getConfigValue<boolean>(configKeys.CLEAR_OUTPUT_ON_START);
    }

    public get allowPDEFiletype(): boolean {
        return this.getConfigValue<boolean>(configKeys.ALLOW_PDE_FILETYPE);
    }

    public get enableUSBDetection(): boolean {
        return this.getConfigValue<boolean>(configKeys.ENABLE_USB_DETECTION);
    }

    public get disableTestingOpen(): boolean {
        return this.getConfigValue<boolean>(configKeys.DISABLE_TESTING_OPEN);
    }

    public get ignoreBoards(): string[] {
        return this.getConfigValue<string[]>(configKeys.IGNORE_BOARDS);
    }

    public set ignoreBoards(value: string[]) {
        this.setConfigValue(configKeys.IGNORE_BOARDS, value, true);
    }

    public get useArduinoCli(): boolean {
        return this.getConfigValue<boolean>(configKeys.USE_ARDUINO_CLI);
    }

    public setUseArduinoCli(value: boolean): Promise<void> {
        return this.setConfigValue(configKeys.USE_ARDUINO_CLI, value, true);
    }

    public get skipHeaderProvider(): boolean {
        return this.getConfigValue<boolean>(configKeys.SKIP_HEADER_PROVIDER);
    }

    public get disableIntelliSenseAutoGen(): boolean {
        return this.getConfigValue<boolean>(configKeys.DISABLE_INTELLISENSE_AUTO_GEN);
    }

    public get analyzeOnOpen(): boolean {
        return this.getConfigValue<boolean>(configKeys.ANALYZE_ON_OPEN);
    }

    public get analyzeOnSettingChange(): boolean {
        return this.getConfigValue<boolean>(configKeys.ANALYZE_ON_SETTING_CHANGE);
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
