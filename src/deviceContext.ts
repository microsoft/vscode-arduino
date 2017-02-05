/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import { IBoard } from "./arduino/boardManager";

/**
 * Interface that represents the arduino context information.
 * @interface
 */
export interface IDeviceContext {
    /**
     * COM Port connect to the device
     * @property {string}
     */
    port: string;

    /**
     * Select board alias used in Aru
     * @property {IBoard}
     */
    board: IBoard;

    /**
     *
     *
     * @property {string}
     */
    sketch: string;
}

export class DeviceContext implements IDeviceContext {
    public static getIntance(): DeviceContext {
        return DeviceContext._deviceContext;
    }

    private static _deviceContext: DeviceContext = new DeviceContext();

    private _port: string;

    private _board: IBoard;

    private _sketch: string;

    /**
     * @constructor
     */
    private constructor() {
    }

    public get port() {
        return this._port;
    }
    public set port(value: string) {
        this._port = value;
    }

    public get board() {
        return this._board;
    }

    public set board(value: IBoard) {
        this._board = value;
    }

    public get sketch() {
        return this._sketch;
    }

    public set sketch(value: string) {
        this._sketch = value;
    }
}
