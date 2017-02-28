/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";
import * as path from "path";

export default class LocalWebServer {
    public static _serverPort: string;
    public static _vscodeExtensionPath: string;
    public static getServerUrl(): string {
        return `http://localhost:${this._serverPort}`;
    }
    public static getEndpointUri(type: string): string {
        return `http://localhost:${this._serverPort}/${type}`;
    }

    private app = express();
    private server;

    constructor(extensionPath: string) {
        LocalWebServer._vscodeExtensionPath = extensionPath;
        this.app.use("/", express.static(path.join(extensionPath, "./out/html")));
        this.app.use(bodyParser.json());
        this.server = http.createServer(this.app);
    }

    public addHandler(url: string, handler: (req, res) => void): void {
        this.app.get(url, handler);
    }

    public addPostHandler(url: string, handler: (req, res) => void): void {
        this.app.post(url, handler);
    }

    public start(): void {
        const port = this.server.listen(0).address().port;
        // tslint:disable-next-line
        console.log(`Starting express server on port: ${port}`);
        LocalWebServer._serverPort = port;
    }
}
