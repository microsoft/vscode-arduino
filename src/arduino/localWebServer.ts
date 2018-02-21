// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";
import * as path from "path";
import * as WebSocket from "ws";

export default class LocalWebServer {
    private app = express();
    private server;
    private wss;
    private _serverPort: string;

    constructor(private _extensionPath: string) {
        this.app.use("/", express.static(path.join(this._extensionPath, "./out/views")));
        this.app.use(bodyParser.json());
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
    }

    public getServerUrl(): string {
        return `http://localhost:${this._serverPort}`;
    }
    public getEndpointUri(type: string): string {
        return `http://localhost:${this._serverPort}/${type}`;
    }
    public getWebSocketUri(): string {
        return `ws://localhost:${this._serverPort}`;
    }

    public addHandler(url: string, handler: (req, res) => void): void {
        this.app.get(url, handler);
    }

    public addPostHandler(url: string, handler: (req, res) => void): void {
        this.app.post(url, handler);
    }

    public getWebSocketServer(): WebSocket.Server {
        return this.wss;
    }

    public start(): void {
        const port = this.server.listen(0).address().port;
        // tslint:disable-next-line
        console.log(`Starting express server on port: ${port}`);
        this._serverPort = port;
    }
}
