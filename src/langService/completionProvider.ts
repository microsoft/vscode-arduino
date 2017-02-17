/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import * as constants from "../common/constants";
import * as util from "../common/util";
import { provideCompletionItems } from "./clang";

export class CompletionProvider implements vscode.CompletionItemProvider, vscode.Disposable {
    private _headerFiles = new Set<string>();
    private _watcher: vscode.FileSystemWatcher;
    private _deviceConfigFile: string = path.join(vscode.workspace.rootPath, constants.DEVICE_CONFIG_FILE);

    public constructor() {
        this.updateHeaderFileList();
        this._watcher = vscode.workspace.createFileSystemWatcher(this._deviceConfigFile);
        this._watcher.onDidCreate(() => this.updateHeaderFileList());
        this._watcher.onDidChange(() => this.updateHeaderFileList());
        this._watcher.onDidDelete(() => this.updateHeaderFileList());
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.CompletionItem[] | Thenable<vscode.CompletionItem[]> {
        // Check if we are currently inside an include statement.
        const text = document.lineAt(position.line).text.substr(0, position.character);
        const match = text.match(/^\s*#\s*include\s*(<[^>]*|"[^"]*)$/);

        if (match) {
            let result = [];
            this._headerFiles.forEach((headerFile) => {
                result.push(new vscode.CompletionItem(headerFile, vscode.CompletionItemKind.File));
            });
            return result;
        } else {
            return provideCompletionItems(document, position, token);
        }
    }

    public dispose() {
        this._watcher.dispose();
    }

    private addLibFiles(libPath: string): void {
        if (!util.directoryExistsSync(libPath)) {
            return;
        }
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
        });
    }

    private updateHeaderFileList(): void {
        this._headerFiles.clear();
        if (!fs.existsSync(this._deviceConfigFile)) {
            return;
        }
        const deviceConfig = JSON.parse(fs.readFileSync(this._deviceConfigFile, "utf8"));
        if (!deviceConfig || !deviceConfig.configurations) {
            return;
        }
        const plat = util.getCppConfigPlatform();
        deviceConfig.configurations.forEach((configSection) => {
            if (configSection.name === plat && Array.isArray(configSection.includePath)) {
                configSection.includePath.forEach((includePath) => {
                    this.addLibFiles(includePath);
                });
            }
        });
    }
}
