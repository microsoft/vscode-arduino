'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fsHelper from '../helper/fsHelper';

export const IS_WINDOWS = /^win/.test(process.platform);

export interface IArduinoSettings {
    arduinoPath: string;
}

export class ArduinoSettings implements IArduinoSettings {
    private static arduinoSettings: ArduinoSettings = new ArduinoSettings();
    constructor() {
        this.initializeSettings();
    }

    public static getIntance(): ArduinoSettings {
        return ArduinoSettings.arduinoSettings;
    }

    private initializeSettings() {
        let arduinoConfig = vscode.workspace.getConfiguration('arduino');
        this.arduinoPath = arduinoConfig.get<string>('arduinoPath');
    }

    private _arduinoPath: string;

    public get arduinoPath(): string {
        return this._arduinoPath;
    }

    public set arduinoPath(value: string) {
        if (this._arduinoPath === value) {
            return;
        }
        try {
            this._arduinoPath = getArduinoExecutable(value);
        }
        catch (ex) {
            this._arduinoPath = value;
        }
    }
}

function getArduinoExecutable(arduinoPath: string): string {
    if (arduinoPath === 'arduino' || fsHelper.fileExists(arduinoPath)) {
        return arduinoPath;
    }

    if (IS_WINDOWS) {
        if (fsHelper.fileExists(path.join(arduinoPath, 'arduino.exe'))) {
            return path.join(arduinoPath, 'arduino.exe');
        }
    } else {
        if (fsHelper.fileExists(path.join(arduinoPath, 'arduino'))) {
            return path.join(arduinoPath, 'arduino');
        }
    }
    return arduinoPath;
}
