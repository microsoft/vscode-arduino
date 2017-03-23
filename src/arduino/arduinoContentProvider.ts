/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as vscode from "vscode";
import * as Constants from "../common/constants";
import * as JSONHelper from "../common/cycle";
import { ArduinoApp } from "./arduino";
import { BoardManager } from "./boardManager";
import { LibraryManager } from "./libraryManager";
import LocalWebServer from "./localWebServer";
import { IArduinoSettings } from "./settings";

export class ArduinoContentProvider implements vscode.TextDocumentContentProvider {
    private _webserver: LocalWebServer;
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor(
        private _settings: IArduinoSettings,
        private _arduinoApp: ArduinoApp,
        private _boardManager: BoardManager,
        private _libraryManager: LibraryManager,
        private _extensionPath: string) {
        this.initialize();
    }

    public initialize() {
        this._webserver = new LocalWebServer(this._extensionPath);
        this._webserver.addHandler("/boardmanager", (req, res) => this.getBoardManagerView(req, res));
        this._webserver.addHandler("/api/boardpackages", async (req, res) => await this.getBoardPackages(req, res));
        this._webserver.addPostHandler("/api/installboard", async (req, res) => await this.installPackage(req, res));
        this._webserver.addPostHandler("/api/uninstallboard", async (req, res) => await this.uninstallPackage(req, res));
        this._webserver.addPostHandler("/api/openlink", async (req, res) => await this.openLink(req, res));
        this._webserver.addHandler("/librarymanager", (req, res) => this.getLibraryManagerView(req, res));
        this._webserver.addHandler("/api/libraries", async (req, res) => await this.getLibraries(req, res));
        this._webserver.addPostHandler("/api/installlibrary", async (req, res) => await this.installLibrary(req, res));
        this._webserver.addPostHandler("/api/uninstalllibrary", async (req, res) => await this.uninstallLibrary(req, res));
        this._webserver.addPostHandler("/api/addlibpath", async (req, res) => await this.addLibPath(req, res));
        this._webserver.start();
    }

    public provideTextDocumentContent(uri: vscode.Uri) {
        let type = "";
        if (uri.toString() === Constants.BOARD_MANAGER_URI.toString()) {
            type = "boardmanager";
        } else if (uri.toString() === Constants.LIBRARY_MANAGER_URI.toString()) {
            type = "librarymanager";
        }

        let timeNow = new Date().getTime();
        return `
        <html>
        <head>
            <script type="text/javascript">
                window.onload = function(event) {
                    console.log('reloaded results window at time ${timeNow}ms');
                    var doc = document.documentElement;
                    var styles = window.getComputedStyle(doc);
                    var backgroundcolor = styles.getPropertyValue('--background-color');
                    var color = styles.getPropertyValue('--color');
                    var theme = document.body.className;
                    var url = "${this._webserver.getEndpointUri(type)}?" +
                            "theme=" + theme +
                            "&backgroundcolor=" + backgroundcolor +
                            "&color=" + color;
                    document.getElementById('frame').src = url;
                };
            </script>
        </head>
        <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
            <iframe id="frame" width="100%" height="100%" frameborder="0" style="position:absolute; left: 0; right: 0; bottom: 0; top: 0px;"/>
        </body>
        </html>`;
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    public getBoardManagerView(req, res) {
        return res.sendFile(path.join(this._extensionPath, "./out/html/index.html"));
    }

    public async getBoardPackages(req, res) {
        const update = (this._settings.autoUpdateIndexFiles && req.query.update === "true");
        await this._boardManager.loadPackages(update);
        return res.json({
            platforms: JSONHelper.decycle(this._boardManager.platforms, undefined),
        });
    }

    public async installPackage(req, res) {
        if (!req.body.packageName || !req.body.arch) {
            return res.status(400).send("BAD Request! Missing { packageName, arch } parameters!");
        } else {
            try {
                await this._arduinoApp.installBoard(req.body.packageName, req.body.arch, req.body.version);
                return res.json({
                    status: "OK",
                });
            } catch (error) {
                return res.status(500).send(`Install board failed with message "code:${error.code}, err:${error.stderr}"`);
            }
        }
    }

    public async uninstallPackage(req, res) {
        if (!req.body.packagePath) {
            return res.status(400).send("BAD Request! Missing { packagePath } parameter!");
        } else {
            try {
                await this._arduinoApp.uninstallBoard(req.body.boardName, req.body.packagePath);
                return res.json({
                    status: "OK",
                });
            } catch (error) {
                return res.status(500).send(`Uninstall board failed with message "${error}"`);
            }
        }
    }

    public async openLink(req, res) {
        if (!req.body.link) {
            return res.status(400).send("BAD Request! Missing { link } parameter!");
        } else {
            try {
                await vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(req.body.link));
                return res.json({
                    status: "OK",
                });
            } catch (error) {
                return res.status(500).send(`Cannot open the link with error message "${error}"`);
            }
        }
    }

    public getLibraryManagerView(req, res) {
        return res.sendFile(path.join(this._extensionPath, "./out/html/index.html"));
    }

    public async getLibraries(req, res) {
        const update = (this._settings.autoUpdateIndexFiles && req.query.update === "true");
        await this._libraryManager.loadLibraries(update);
        return res.json({
            libraries: this._libraryManager.libraries,
        });
    }

    public async installLibrary(req, res) {
        if (!req.body.libraryName) {
            return res.status(400).send("BAD Request! Missing { libraryName } parameters!");
        } else {
            try {
                await this._arduinoApp.installLibrary(req.body.libraryName, req.body.version);
                return res.json({
                    status: "OK",
                });
            } catch (error) {
                return res.status(500).send(`Install library failed with message "code:${error.code}, err:${error.stderr}"`);
            }
        }
    }

    public async uninstallLibrary(req, res) {
        if (!req.body.libraryPath) {
            return res.status(400).send("BAD Request! Missing { libraryPath } parameters!");
        } else {
            try {
                await this._arduinoApp.uninstallLibrary(req.body.libraryName, req.body.libraryPath);
                return res.json({
                    status: "OK",
                });
            } catch (error) {
                return res.status(500).send(`Uninstall library failed with message "code:${error.code}, err:${error.stderr}"`);
            }
        }
    }

    public async addLibPath(req, res) {
        if (!req.body.path) {
            return res.status(400).send("BAD Request! Missing { path } parameters!");
        } else {
            try {
                await this._arduinoApp.addLibPath(req.body.path);
                await this._arduinoApp.includeLibrary(req.body.path);
                return res.json({
                    status: "OK",
                });
            } catch (error) {
                return res.status(500).send(`Add library path failed with message "code:${error.code}, err:${error.stderr}"`);
            }
        }
    }
}
