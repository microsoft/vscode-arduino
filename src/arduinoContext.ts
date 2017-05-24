/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/
import { ArduinoApp } from "./arduino/arduino";
import { ArduinoSettings } from "./arduino/arduinoSettings";
import { BoardManager } from "./arduino/boardManager";
import { ExampleManager } from "./arduino/exampleManager";
import { LibraryManager } from "./arduino/libraryManager";
import { DebugConfigurator } from "./debug/configurator";
import { DebuggerManager } from "./debug/debuggerManager";
import { DeviceContext } from "./deviceContext";

export class ArduinoContext {
    public static get initialized(): boolean {
        return !!ArduinoContext._arduinoApp;
    }

    public static get arduinoApp(): ArduinoApp {
        return ArduinoContext._arduinoApp;
    }

    public static set arduinoApp(value: ArduinoApp) {
        ArduinoContext._arduinoApp = value;
    }

    public static get boardManager() {
        return ArduinoContext._boardManager;
    }

    public static set boardManager(value: BoardManager) {
        ArduinoContext._boardManager = value;
    }

    public static get arduinoConfigurator(): DebugConfigurator {
        if (ArduinoContext._arduinoConfigurator === null) {
            const debuggerManager = new DebuggerManager(
                DeviceContext.getInstance().extensionPath,
                ArduinoContext.arduinoApp.settings,
                ArduinoContext.boardManager);
            debuggerManager.initialize();
            ArduinoContext._arduinoConfigurator = new DebugConfigurator(
                ArduinoContext.arduinoApp, ArduinoContext.arduinoApp.settings
                , ArduinoContext.boardManager, debuggerManager);
        }
        return ArduinoContext._arduinoConfigurator;
    }

    public static set arduinoConfigurator(value: DebugConfigurator) {
        ArduinoContext._arduinoConfigurator = value;
    }

    private static _arduinoApp: ArduinoApp = null;
    private static _arduinoConfigurator: DebugConfigurator = null;
    private static _boardManager: BoardManager = null;
}
