/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import * as WinReg from "winreg";
import * as util from "../common/util";

import { resolveArduinoPath, validateArduinoPath } from "../common/platform";

import { VscodeSettings } from "./vscodeSettings";

export interface IArduinoSettings {
    arduinoPath: string;
    commandPath: string;
    defaultExamplePath: string;
    packagePath: string;
    defaultPackagePath: string;
    defaultLibPath: string;
    sketchbookPath: string;
    preferencePath: string;
    preferences: Map<string, string>;
    loadPreferences(): void;
}

export class ArduinoSettings implements IArduinoSettings {
    private _arduinoPath: string;

    private _packagePath: string;

    private _sketchbookPath: string;

    private _preferences: Map<string, string>;

    public constructor() {
    }

    public async initialize() {
        const platform = os.platform();
        await this.tryResolveArduinoPath();
        if (platform === "win32") {
            await this.updateWindowsPath();
        } else if (platform === "linux") {
            this._packagePath = path.join(process.env.HOME, ".arduino15");
            this._sketchbookPath = this.preferences.get("sketchbook.path") || path.join(process.env.HOME, "Arduino");
        } else if (platform === "darwin") {
            this._packagePath = path.join(process.env.HOME, "Library/Arduino15");
            this._sketchbookPath = this.preferences.get("sketchbook.path") || path.join(process.env.HOME, "Documents/Arduino");
        }
    }

    public get arduinoPath(): string {
        return this._arduinoPath;
    }

    public get defaultExamplePath(): string {
        if (os.platform() === "darwin") {
            return path.join(this._arduinoPath, "Arduino.app/Contents/Java/examples");
        } else {
            return path.join(this._arduinoPath, "examples");
        }
    }

    public get packagePath(): string {
        return this._packagePath;
    }

    public get defaultPackagePath(): string {
        if (os.platform() === "darwin") {
            return path.join(this._arduinoPath, "Arduino.app/Contents/Java/hardware");
        } else { // linux and win32.
            return path.join(this._arduinoPath, "hardware");
        }
    }

    public get defaultLibPath(): string {
        if (os.platform() === "darwin") {
            return path.join(this._arduinoPath, "Arduino.app/Contents/Java/libraries");
        } else { // linux and win32
            return path.join(this._arduinoPath, "libraries");
        }
    }

    public get commandPath(): string {
        const platform = os.platform();
        if (platform === "darwin") {
            return path.join(this._arduinoPath, path.normalize("Arduino.app/Contents/MacOS/Arduino"));
        } else if (platform === "linux") {
            return path.join(this._arduinoPath, "arduino");
        } else if (platform === "win32") {
            return path.join(this._arduinoPath, "arduino_debug.exe");
        }
    }

    public get sketchbookPath() {
        return this._sketchbookPath;
    }

    public get preferencePath() {
        return path.join(this.packagePath, "preferences.txt");
    }

    public get preferences() {
        if (!this._preferences) {
            this.loadPreferences();
        }
        return this._preferences;
    }

    public loadPreferences() {
        this._preferences = util.parseConfigFile(this.preferencePath);
    }

    /**
     * For Windows platform, there are two situations here:
     *  - User change the location of the default *Documents* folder.
     *  - Use the windows store Arduino app.
     */
    private async updateWindowsPath(): Promise<void> {
        let folder;
        try {
            folder = await util.getRegistryValues(WinReg.HKCU,
                "\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders",
                "Personal");
        } catch (ex) {
        }
        if (!folder) {
            folder = path.join(process.env.USERPROFILE, "Documents");
        }
        // For some case, docFolder parsed from win32 registry looks like "%USERPROFILE%\Documents,
        // Should replace the environment variables with actual value.
        folder = folder.replace(/%([^%]+)%/g, (match, p1) => {
            return process.env[p1];
        });
        if (util.fileExistsSync(path.join(this._arduinoPath, "AppxManifest.xml"))) {
            this._packagePath = path.join(folder, "ArduinoData");
        } else {
            this._packagePath = path.join(process.env.LOCALAPPDATA, "Arduino15");
        }
        this._sketchbookPath = this.preferences.get("sketchbook.path") || path.join(folder, "Arduino");
    }

    private async tryResolveArduinoPath(): Promise<void> {
        // Query arduino path sequentially from the following places such as "vscode user settings", "system environment variables",
        // "usual software installation directory for each os".
        // 1. Search vscode user settings first.
        const configValue = VscodeSettings.getInstance().arduinoPath;
        if (!configValue || !configValue.trim()) {
            // 2 & 3. Resolve arduino path from system environment variables and usual software installation directory.
            this._arduinoPath = await Promise.resolve(resolveArduinoPath());
        } else {
            this._arduinoPath = configValue;
        }

        if (!this._arduinoPath) { // Pop up vscode User Settings page when cannot resolve arduino path.
            vscode.window.showErrorMessage(`Cannot find the arduino installation path. Please specify the "arduino.path" in the User Settings.` +
                " Requires a restart after change.");
            vscode.commands.executeCommand("workbench.action.openGlobalSettings");
        } else if (!validateArduinoPath(this._arduinoPath)) { // Validate if arduino path is the correct path.
            vscode.window.showErrorMessage(`Cannot find arduino executable program under directory "${this._arduinoPath}". ` +
                `Please set the correct "arduino.path" in the User Settings. Requires a restart after change.`);
            vscode.commands.executeCommand("workbench.action.openGlobalSettings");
        }
    }
}
