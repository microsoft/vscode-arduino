/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ClangFormatter } from "./clangFormatter";

export class FormatterProvider implements vscode.DocumentFormattingEditProvider {
    private _formatter = new ClangFormatter();
    constructor() {
    }

    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken):
        Thenable<vscode.TextEdit[]> {
        return this._formatter.formatDocument(document);
    }
}
