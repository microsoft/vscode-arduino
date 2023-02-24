// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArduinoApp } from "./arduino/arduino";
import { BoardManager } from "./arduino/boardManager";

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

    // TODO EW: This is redundant: the board manager is already part of
    // the arduino app
    public get boardManager() {
        return this._boardManager;
    }

    public set boardManager(value: BoardManager) {
        this._boardManager = value;
    }

    // TODO EW: You don't have to initialize members to null
    //  if they don't get a default value or aren't initialized
    //  within a constructor they are "undefined" by default.
    //  This makes comparing against null (above) superfluous.
    private _arduinoApp: ArduinoApp = null;
    private _boardManager: BoardManager = null;
}

export default new ArduinoContext();
