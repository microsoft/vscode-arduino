// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArduinoApp } from "./arduino/arduino";
import { BoardManager } from "./arduino/boardManager";
import { DebugConfigurator } from "./debug/configurator";
import { DebuggerManager } from "./debug/debuggerManager";
import { DeviceContext } from "./deviceContext";

class ArduinoContext {
    public get initialized(): boolean {
        return !!this._arduinoApp;
    }

    public get arduinoApp(): ArduinoApp {
        return this._arduinoApp;
    }

    public set arduinoApp(value: ArduinoApp) {
        this._arduinoApp = value;
    }

    public get boardManager() {
        return this._boardManager;
    }

    public set boardManager(value: BoardManager) {
        this._boardManager = value;
    }

    public get arduinoConfigurator(): DebugConfigurator {
        if (this._arduinoConfigurator === null) {
            const debuggerManager = new DebuggerManager(
                DeviceContext.getInstance().extensionPath,
                this.arduinoApp.settings,
                this.boardManager);
            debuggerManager.initialize();
            this._arduinoConfigurator = new DebugConfigurator(
                this.arduinoApp, this.arduinoApp.settings
                , this.boardManager, debuggerManager);
        }
        return this._arduinoConfigurator;
    }

    public set arduinoConfigurator(value: DebugConfigurator) {
        this._arduinoConfigurator = value;
    }

    private _arduinoApp: ArduinoApp = null;
    private _arduinoConfigurator: DebugConfigurator = null;
    private _boardManager: BoardManager = null;
}

export default new ArduinoContext();
