/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import vscode = require("vscode");
import constants = require("../common/constants");
import util = require("../common/util")

export class IncludeCompletionProvider implements vscode.CompletionItemProvider, vscode.Disposable {

    private _headerFiles = new Set<string>();
    private _watcher: vscode.FileSystemWatcher;
    private _cppPropertyFilePath: string = path.join(vscode.workspace.rootPath, constants.C_CPP_PROPERTIES);

    private addLibFiles(libPath: string): void {
        const subItems = fs.readdirSync(libPath);
        subItems.forEach((item) => {
            try {
                let state = fs.statSync(path.join(libPath, item));
                if (state.isFile() && item.endsWith(".h")) {
                    this._headerFiles.add(item);
                } else if (state.isDirectory()) {
                    this.addLibFiles(path.join(libPath, item));
                }
            } catch (ex) {
            }
        })
    }

    private updateHeaderFileList(): void {
        this._headerFiles.clear();
        if (!fs.existsSync(this._cppPropertyFilePath)) {
            return;
        }
        const cppProperties = JSON.parse(fs.readFileSync(this._cppPropertyFilePath, "utf8"));
        if (!cppProperties || !cppProperties.configurations) {
            return;
        }
        const plat = util.getCppConfigPlatform();
        cppProperties.configurations.forEach((configSection) => {
            if (configSection.name === plat && Array.isArray(configSection.includePath)) {
                configSection.includePath.forEach((includePath) => {
                    this.addLibFiles(includePath);
                })
            }
        });
    }

    public constructor() {
        this.updateHeaderFileList();

        this._watcher = vscode.workspace.createFileSystemWatcher(this._cppPropertyFilePath);
        this._watcher.onDidCreate(() => this.updateHeaderFileList());
        this._watcher.onDidChange(() => this.updateHeaderFileList());
        this._watcher.onDidDelete(() => this.updateHeaderFileList());
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionItem[] {
        // Check if we are currently inside an include statement.
        const text = document.lineAt(position.line).text.substr(0, position.character);
        const match = text.match(/^\s*#\s*include\s*(<[^>]*|"[^"]*)$/);

        if (!match) {
            return [];
        }

        let result = [];
        this._headerFiles.forEach((headerFile) => {
            result.push(new vscode.CompletionItem(headerFile, vscode.CompletionItemKind.File));
        });
        return result;
    }

    public dispose() {
        this._watcher.dispose();
    }
}
