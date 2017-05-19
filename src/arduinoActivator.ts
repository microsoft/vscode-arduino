import { ArduinoApp } from "./arduino/arduino";
import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import { ArduinoSettings } from "./arduino/arduinoSettings";
import { BoardManager } from "./arduino/boardManager";
import { ExampleManager } from "./arduino/exampleManager";
import { LibraryManager } from "./arduino/libraryManager";
import { IBoard } from "./arduino/package";
import { DebugConfigurator } from "./debug/configurator";
import { DebuggerManager } from "./debug/debuggerManager";
import { DeviceContext } from "./deviceContext";

export class ArduinoActivator {
    private static _activator: ArduinoActivator;

    public static get instance(): ArduinoActivator {
        if (!ArduinoActivator._activator) {
            ArduinoActivator._activator = new ArduinoActivator();
        }
        return ArduinoActivator._activator;
    }

    private _settings: ArduinoSettings;

    private _arduinoApp: ArduinoApp;

    private _boardManager: BoardManager;

    private _arduinoContentProvider: ArduinoContentProvider;

    private _libraryManager: LibraryManager;

    private _exampleManager: ExampleManager;

    private _debugConfigurator: DebugConfigurator;

    private _initializePromise: Promise<void>;

    public get initialized(): boolean {
        return !!this._arduinoApp;
    }

    public async initialize() {
        if (this._initializePromise) {
            await this._initializePromise;
            return;
        }
        this._initializePromise = (async () => {
            await DeviceContext.getIntance().loadContext();
            this._settings = new ArduinoSettings();
            await this._settings.initialize();
            const arduinoApp = new ArduinoApp(this._settings);
            await arduinoApp.initialize();

            // Arduino board manager & library manager
            this._boardManager = new BoardManager(this._settings, arduinoApp);
            await this._boardManager.loadPackages();

            this._arduinoApp = arduinoApp;
        })();
        await this._initializePromise;
    }

    public get settings() {
        return this._settings;
    }

    public get arduinoApp() {
        return this._arduinoApp;
    }

    public get boardManager() {
        return this._boardManager;
    }

    public get libraryManager() {
        if (!this._libraryManager) {
            this._libraryManager = new LibraryManager(this._settings, this._arduinoApp);
        }
        return this._libraryManager;
    }

    public get exampleManager() {
        if (!this._exampleManager) {
            this._exampleManager = new ExampleManager(this._settings);
        }
        return this._exampleManager;
    }

    public get arduinoContentProvider() {
        if (this._arduinoContentProvider) {
            return this._arduinoContentProvider;
        }
        this._arduinoContentProvider = new ArduinoContentProvider(DeviceContext.getIntance().extensionPath);
        this._arduinoContentProvider.initialize();
        return this._arduinoContentProvider;
    }

    public get currentBoard(): IBoard {
        return this._boardManager.currentBoard;
    }

    public get currentBoardName(): string {
        return this._boardManager.currentBoard ? this._boardManager.currentBoard.name : "";
    }

    public get debugConfigurator(): DebugConfigurator {
        if (this._debugConfigurator) {
            return this._debugConfigurator;
        }
        const extensionPath = DeviceContext.getIntance().extensionPath;
        const debuggerManager = new DebuggerManager(extensionPath, this._settings);
        debuggerManager.initialize();
        this._debugConfigurator =  new DebugConfigurator(extensionPath, debuggerManager);
        return this._debugConfigurator;
    }

}
