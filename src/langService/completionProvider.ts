/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ClangProvider } from "./clang";

export class CompletionProvider implements vscode.CompletionItemProvider {
    public constructor(private _clangProvider: ClangProvider) {
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        vscode.CompletionItem[] | Thenable<vscode.CompletionItem[]> {
        // Check if we are currently inside an include statement.
        const text = document.lineAt(position.line).text.substr(0, position.character);
        const match = text.match(/^\s*#\s*include\s*(<[^>]*|"[^"]*)$/);

        if (match) {
            let result = [];
            this._clangProvider.headerFiles.forEach((headerFile) => {
                result.push(new vscode.CompletionItem(headerFile, vscode.CompletionItemKind.File));
            });
            return result;
        } else {
            return this._clangProvider.provideCompletionItems(document, position, token);
        }
    }

}
