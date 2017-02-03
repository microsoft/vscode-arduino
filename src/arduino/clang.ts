/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as vscode from "vscode";

import * as util from "../common/util";
import { ArduinoSettings } from "./settings";

export function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
    Thenable<vscode.CompletionItem[]> {
    let delPos = findPreviousDelimiter(document, position);
    const args = buildCompletionArgs(delPos);
    const options = {
        cwd: vscode.workspace.rootPath,
    };

    return new Promise((resolve, reject) => {
        let proc = childProcess.execFile("clang", args, options,
            (error, stdout, stderr) => {
                // TODO: Fix error cases.
                resolve({ error, stdout, stderr });
            });
        proc.stdin.end(document.getText());
    }).then((result: any) => {
        return parseCompletionItems(result.stdout);
    });
}

export function provideDefinitionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
    Thenable<vscode.Definition> {
    const range = document.getWordRangeAtPosition(position);
    const word = document.getText(range);
    const args = buildDefinitionArgs(word);

    const options = {
        cwd: vscode.workspace.rootPath,
    };

    return new Promise((resolve, reject) => {
        let proc = childProcess.execFile("clang", args, options,
            (error, stdout, stderr) => {
                // TODO: Fix error cases
                resolve({ error, stdout, stderr });
            });
        proc.stdin.end(document.getText());
    }).then((result: any) => {
        return parseAstDump(result.stdout, word);
    });
}

const DELIMITERS = '~`!@#$%^&*()-+={}[]|\\\'";:/?<>,. \t\n';

function isDelimiter(c: string) {
    return DELIMITERS.indexOf(c) !== -1;
}

function findPreviousDelimiter(document: vscode.TextDocument, position: vscode.Position): vscode.Position {
    let line = position.line;
    let char = position.character;
    const s = document.getText(new vscode.Range(line, 0, line, char));
    while (char > 0 && !isDelimiter(s[char - 1])) {
        char--;
    }
    return new vscode.Position(line, char);
}

function buildCompletionArgs(position: vscode.Position): string[] {
    const args = [];
    args.push("-x", "c++");
    args.push("-std=c++11");
    const includePath = ArduinoSettings.getIntance().includePath;
    includePath.forEach((path) => {
        args.push(`-I${path}`);
    });
    args.push("-fsyntax-only");
    args.push("-fparse-all-comments");
    args.push("-Xclang", "-code-completion-macros");
    args.push("-Xclang", "-code-completion-brief-comments");
    args.push("-Xclang", `-code-completion-at=<stdin>:${position.line + 1}:${position.character + 1}`);

    args.push("-");
    return args;
}

function buildDefinitionArgs(word: string) {
    const args = [];
    args.push("-x", "c++");
    args.push("-std=c++11");
    const includePath = ArduinoSettings.getIntance().includePath;
    includePath.forEach((path) => {
        args.push(`-I${path}`);
    });
    args.push("-fsyntax-only");
    args.push("-fparse-all-comments");
    args.push("-Xclang", "-code-completion-macros");
    args.push("-Xclang", "-code-completion-brief-comments");
    args.push("-Xclang", "-ast-dump");
    args.push("-Xclang", "-ast-dump-filter");
    args.push("-Xclang", word);

    args.push("-");
    return args;
}

const completionRe = /^COMPLETION: (.*?)(?: : (.*))?$/;
const descriptionRe = /^(.*?)(?: : (.*))?$/;
const returnTypeRe = /\[#([^#]+)#\]/ig;
const argumentTypeRe = /\<#([^#]+)#\>/ig;
const optionalArgumentLeftRe = /\{#(,? ?.+?)(?=#\}|\{#)/ig;
const optionalArgumentRightRe = /#\}/ig;

function parseCompletionItem(line: string): vscode.CompletionItem | void {
    let matched = line.match(completionRe);
    if (matched === null) {
        return;
    }
    let [_line, symbol, description] = matched;
    let item = new vscode.CompletionItem(symbol);
    if (description === undefined || description === null) {
        item.detail = symbol;
        item.kind = vscode.CompletionItemKind.Class;
        return item;
    }
    let [_description, signature, comment] = description.match(descriptionRe);
    if (comment !== null) {
        item.documentation = comment;
    }
    let hasValue = false;
    signature = signature.replace(returnTypeRe, (match: string, arg: string): string => {
        hasValue = true;
        return arg + " ";
    });
    signature = signature.replace(argumentTypeRe, (match: string, arg: string): string => {
        return arg;
    });
    signature = signature.replace(optionalArgumentLeftRe, (match: string, arg: string): string => {
        return arg + "=?";
    });
    signature = signature.replace(optionalArgumentRightRe, (match: string, arg: string): string => {
        return "";
    });
    item.detail = signature;
    if (signature.indexOf("(") !== -1) {
        item.kind = vscode.CompletionItemKind.Function;
    } else if (hasValue) {
        item.kind = vscode.CompletionItemKind.Variable;
    } else {
        item.kind = vscode.CompletionItemKind.Class;
    }
    return item;
}

function parseCompletionItems(data: string): vscode.CompletionItem[] {
    let result: vscode.CompletionItem[] = [];
    data.split(/\r\n|\r|\n/).forEach((line) => {
        let item = parseCompletionItem(line);
        if (item instanceof vscode.CompletionItem) {
            result.push(item);
        }
    });
    return result;
}

const positionRe = /<(.+)>/;
const startPositionRe = /(\S+):(\d+):(\d+)/;
const endPositionRe = /(line|col):(\d+)(?::(\d+))?/;

function parseAstDump(aststring, target) {
    const candidates = aststring.split("\n\n");
    const places = [];
    candidates.forEach((candidate) => {
        let match = candidate.match(new RegExp(`^Dumping\\s(?:[A-Za-z_]*::)*?${target}:`));
        if (match !== null) {
            const lines = candidate.split("\n");
            if (lines.length < 2) {
                return;
            }
            const positionMath = lines[1].match(positionRe);
            if (positionMath === null) {
                return;
            }
            const declTerms = positionMath[1].split(",");
            const startMatch = declTerms[0].match(startPositionRe);
            const endMatch = declTerms[1].match(endPositionRe);
            let startPosition = null;
            let endPosition = null;
            if (endMatch[1] === "line") {
                endPosition = new vscode.Position(parseInt(endMatch[2], 10), parseInt(endMatch[3], 10));
            } else {
                endPosition = new vscode.Position(parseInt(startMatch[2], 10) - 1, parseInt(endMatch[2], 10) - 1);
            }
            places.push(new vscode.Location(vscode.Uri.file(startMatch[1]), new vscode.Range(
                new vscode.Position(parseInt(startMatch[2], 10) - 1, parseInt(startMatch[3], 10) - 1),
                endPosition)));
        }
    });
    return places;
}
