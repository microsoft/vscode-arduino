/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { ILibrary, LibraryManager } from "./libraryManager";

export class LibraryContentProvider implements vscode.TextDocumentContentProvider {

    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor(private _libraryManager: LibraryManager, private _extensionPath: string) {
    }

    public async provideTextDocumentContent(uri: vscode.Uri) {

        if (!this._libraryManager.libraries) {
            await this._libraryManager.loadLibraries();
        }
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

    public async update(uri: vscode.Uri) {
        await this._libraryManager.loadLibraries();
        this._onDidChange.fire(uri);
    }

    private buildBoardView(): string {
        let result = "";
        this._libraryManager.libraries.forEach((library: ILibrary) => {
            result += `<div class="library">
                ${this.buildLibrarySectionHeader(library)}
                ${this.buildLibrarySectionBody(library)}
                ${this.buildLibrarySectionButtons(library)}
            </div>`;
        });
        return result;
    }

    private buildLibrarySectionHeader(lib: ILibrary): string {
        let result = `<div><span class="library-header"> ${lib.name}</span> </div>`;
        return result;
    }

    private buildLibrarySectionBody(lib: ILibrary): string {
        if (!lib.builtIn) {
            return `<div>${lib.paragraph}</div>`;
        } else {
            return `<div>Built-in library for ${lib.architectures}</div>`;
        }
    }

    private buildLibrarySectionButtons(lib: ILibrary): string {
        if (lib.installed) {
            if (lib.builtIn) {
                return `<div class="library-footer">
                <a href="${encodeURI("command:arduino.addLibPath?" + JSON.stringify([lib.installedPath]))}" class="operation">Add to Include Path</a>
                </div>`;
            } else {
                return `<div class="library-footer">
                <a href="${encodeURI("command:arduino.uninstallLibrary?" + JSON.stringify([lib.name]))}" class="operation">Remove</a>
                <a href="${encodeURI("command:arduino.addLibPath?" + JSON.stringify([lib.installedPath]))}" class="operation">Add to Include Path</a>
                </div>`;
            }
        } else {
            return `<div class="library-footer"><a href="${encodeURI("command:arduino.installLibrary?" + JSON.stringify([lib.name]))}" `
                + `class="operation">Install</a></div>`;
        }
    }

    private getCssContent(): string {
        return fs.readFileSync(path.join(this._extensionPath, "html", "library.css"), "utf8");
    }
}
