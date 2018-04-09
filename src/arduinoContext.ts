// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArduinoApp } from "./arduino/arduino";
import { BoardManager } from "./arduino/boardManager";
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

    public get debuggerManager(): DebuggerManager {
        if (this._debuggerManager === null) {
            this._debuggerManager = new DebuggerManager(
                DeviceContext.getInstance().extensionPath,
                this.arduinoApp.settings,
                this.boardManager);
            this._debuggerManager.initialize();
        }
        return this._debuggerManager;
    }

    private _arduinoApp: ArduinoApp = null;
    private _debuggerManager: DebuggerManager = null;
    private _boardManager: BoardManager = null;
}

export default new ArduinoContext();
