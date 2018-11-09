// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArduinoApp } from "./arduino/arduino";
import { BoardManager } from "./arduino/boardManager";
import { DebuggerManager } from "./debug/debuggerManager";
import { DeviceContext } from "./deviceContext";

export class ArduinoContext {
    static get initialized(): boolean {
        return !!ArduinoContext._arduinoApp;
    }

    static get arduinoApp(): ArduinoApp {
        return ArduinoContext._arduinoApp;
    }

    static set arduinoApp(value: ArduinoApp) {
        ArduinoContext._arduinoApp = value;
    }

    static get boardManager() {
        return ArduinoContext._boardManager;
    }

    static set boardManager(value: BoardManager) {
        ArduinoContext._boardManager = value;
    }

    static get debuggerManager(): DebuggerManager {
        if (ArduinoContext._debuggerManager === null) {
            ArduinoContext._debuggerManager = new DebuggerManager(
                DeviceContext.getInstance().extensionPath,
                ArduinoContext.arduinoApp.settings,
                ArduinoContext.boardManager);
                ArduinoContext._debuggerManager.initialize();
        }
        return ArduinoContext._debuggerManager;
    }

    private static _arduinoApp: ArduinoApp = null;
    private static _debuggerManager: DebuggerManager = null;
    private static _boardManager: BoardManager = null;
}
