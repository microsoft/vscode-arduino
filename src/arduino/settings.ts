"use strict";

import * as path from "path";
import * as vscode from "vscode";
import * as util from "../common/util";

export const IS_WINDOWS = /^win/.test(process.platform);

export interface IArduinoSettings {
    arduinoPath: string;
}

export class ArduinoSettings implements IArduinoSettings {
    public static getIntance(): ArduinoSettings {
        return ArduinoSettings.arduinoSettings;
    }

    private static arduinoSettings: ArduinoSettings = new ArduinoSettings();

    private _arduinoPath: string;

    constructor() {
        this.initializeSettings();
    }

    private initializeSettings() {
        let arduinoConfig = vscode.workspace.getConfiguration("arduino");
        this.arduinoPath = arduinoConfig.get<string>("arduinoPath");
    }

    public get arduinoPath(): string {
        return this._arduinoPath;
    }

    public set arduinoPath(value: string) {
        if (this._arduinoPath === value) {
            return;
        }
        try {
            this._arduinoPath = getArduinoExecutable(value);
        } catch (ex) {
            this._arduinoPath = value;
        }
    }
}

function getArduinoExecutable(arduinoPath: string): string {
    if (arduinoPath === "arduino" || util.fileExists(arduinoPath)) {
        return arduinoPath;
    }

    if (IS_WINDOWS) {
        if (util.fileExists(path.join(arduinoPath, "arduino.exe"))) {
            return path.join(arduinoPath, "arduino.exe");
        }
    } else {
        if (util.fileExists(path.join(arduinoPath, "arduino"))) {
            return path.join(arduinoPath, "arduino");
        }
    }
    return arduinoPath;
}
