/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/
import * as childProcess from "child_process";
import * as vscode from "vscode";

export class ClangFormatter {
    public formatDocument(document: vscode.TextDocument): Thenable<vscode.TextEdit[]> {
        const args = this.buildFormatterArgs(document);
        const options = {
            cwd: vscode.workspace.rootPath,
        };

        return new Promise((resolve, reject) => {
            let proc = childProcess.execFile("clang-format", args, options,
                (error, stdout, stderr) => {
                    // TODO: Fix error cases.
                    resolve({ error, stdout, stderr });
                });
            proc.stdin.end(document.getText());
        }).then((result: any) => {
            return this.parseFormatResult(document, result.stdout);
        });
    }

    private buildFormatterArgs(document: vscode.TextDocument): string[] {
        let args = [];
        args.push("-style=file");
        args.push("-fallback-style=Visual Studio");
        args.push(`-assume-filename=${document.fileName}`);
        return args;
    }

    private parseFormatResult(document: vscode.TextDocument, output: string): vscode.TextEdit[] {
        let res = [];
        let startPos = new vscode.Position(0, 0);
        let endPos = document.lineAt(document.lineCount - 1).range.end;
        // Replace the whole document.
        res.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), output));
        return res;
    }
}
