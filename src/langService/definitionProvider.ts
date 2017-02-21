/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ClangProvider } from "./clang";

export class DefinitionProvider implements vscode.DefinitionProvider {
    constructor(private _clangProvider: ClangProvider) {
    }
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        Thenable<vscode.Definition> {
        return this._clangProvider.provideDefinitionItems(document, position, token);
    }
}
