/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { BoardManager, IPackage, IPlatform } from "./boardManager";

/**
 * Class represent Arduino Board Manager view.
 * @class
 */
export class BoardContentProvider implements vscode.TextDocumentContentProvider {

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor(private _boardManager: BoardManager, private _extensionPath: string) {
    }

    public async initialize() {
        await this._boardManager.loadPackages();
    }

    public async provideTextDocumentContent(uri: vscode.Uri) {
        await this._boardManager.loadPackages();
        const packageView = this.buildBoardView();
        const cssContent = this.getCssContent();

        return `
        <html>
            <style>
                ${cssContent}
            </style>
            <head>
            </head>
            <body>
                ${packageView}
            </body>
        </html>
        `;
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    /**
     * TODO: Add version selection for board manager.
     */
    private buildBoardView(): string {
        let result = "";
        this._boardManager.platforms.forEach((p: IPlatform) => {
            result += `<div class="board">
                ${this.buildBoardSectionHeader(p)}
                ${this.buildBoardSectionBody(p)}
                ${this.buildBoardSecionButtons(p)}
            </div>`;
        });
        return result;
    }

    private buildBoardSectionHeader(p: IPlatform): string {
        let result = `<div><span class="board-header"> ${p.name}</span> by <span class="board-header" href="${p.package.websiteURL}">${p.package.maintainer}</span>`;
        result
            += (p.installedVersion ? ` version ${p.installedVersion} <span class="installed-header">INSTALLED</span>` : "")
            + "</div>";
        return result;
    }

    private buildBoardSectionBody(p: IPlatform): string {
        let result = ` <div>Boards included in this package:<br/> ${p.boards.map((board: any) => board.name).join(", ")}  </div>`;
        if (p.help && p.help.online) {
            result += `<div><a href="${p.help.online}">Online help</a></div>`;
        } else if (p.package.help && p.package.help.online) {
            result += `<div><a href="${p.package.help.online}">Online help</a></div>`;
        }

        result += `<div><a href="${p.package.websiteURL}">More info</a></div>`;
        return result;
    }

    private buildBoardSecionButtons(p: IPlatform): string {
        if (p.installedVersion) {
            return `<div class="board-footer"><a href="${encodeURI("command:arduino.uninstallBoard?" + JSON.stringify([p.rootBoardPath]))}" class="operation">Remove</a></div>`;
        } else if (!p.defaultPlatform) {
            return `<div class="board-footer"><a href="${encodeURI("command:arduino.installBoard?" + JSON.stringify([p.package.name, p.architecture]))}" class="operation">Install</a></div>`;
        }
    }

    private getCssContent(): string {
        return fs.readFileSync(path.join(this._extensionPath, "html", "board.css"), "utf8");
    }
}
