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
import { DeviceContext } from "./deviceContext";

export class ArduinoActivator {
    public static async activate() {
        if (ArduinoActivator._initializePromise) {
            await ArduinoActivator._initializePromise;
            return;
        }

        ArduinoActivator._initializePromise = (async () => {
            const arduinoSettings = new ArduinoSettings();
            await arduinoSettings.initialize();
            const arduinoApp = new ArduinoApp(arduinoSettings);
            await arduinoApp.initialize();

            // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
            const deviceContext = DeviceContext.getInstance();
            await deviceContext.loadContext();
            // Arduino board manager & library manager
            arduinoApp.boardManager = new BoardManager(arduinoSettings, arduinoApp);
            ArduinoContext.boardManager = arduinoApp.boardManager;
            await arduinoApp.boardManager.loadPackages();
            arduinoApp.libraryManager = new LibraryManager(arduinoSettings, arduinoApp);
            arduinoApp.exampleManager = new ExampleManager(arduinoSettings, arduinoApp);
            ArduinoContext.arduinoApp = arduinoApp;
        })();
        await ArduinoActivator._initializePromise;
    }
    private static _initializePromise: Promise<void>;
}

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
        return ArduinoContext._arduinoConfigurator;
    }

    private static _arduinoApp: ArduinoApp = null;
    private static _arduinoConfigurator: DebugConfigurator = null;
    private static _boardManager: BoardManager = null;
}
