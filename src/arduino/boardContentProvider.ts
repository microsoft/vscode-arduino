/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { BoardManager, IPackage, IPlatform } from "./boardManager";

export class BoardContentProvider implements vscode.TextDocumentContentProvider {

    constructor(private _boardManager: BoardManager, private _extensionPath: string) {
        this._boardManager.loadPackages();
    }

    public provideTextDocumentContent(uri: vscode.Uri): string {
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
        return `<a href="${encodeURI("command:arduino.installBoard?" + JSON.stringify([p.package.name, p.architecture]))}">Install</a>`;
    }

    private getCssContent(): string {
        return fs.readFileSync(path.join(this._extensionPath, "html", "index.css"), "utf8");
    }
}
