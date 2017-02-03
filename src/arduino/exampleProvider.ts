/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as util from "../common/util";

import { TreeExplorerNodeProvider } from "vscode";
import { IArduinoSettings } from "./settings";

export type ExampleNode = Root // Root node
    | Node // Exmaple folders
    | Leaf // Exmaple source code
    ;

export class Root {
    public kind: "root" = "root";
}

export class Node {
    public kind: "node" = "node";
    constructor(public fullPath: string, public displayName: string) { }
}

export class Leaf {
    public kind: "leaf" = "leaf";
    constructor(public fullPath: string, public displayName: string) { }
}

export class ExampleProvider implements TreeExplorerNodeProvider<ExampleNode> {

    constructor(private arduinoSettings: IArduinoSettings) {
    }

    /**
     * As root node is invisible, its label doesn"t matter.
     */
    public getLabel(node: ExampleNode): string {
        return node.kind === "root" ? "" : node.displayName;
    }

    /**
     * Leaf is unexpandable.
     */
    public getHasChildren(node: ExampleNode): boolean {
        return node.kind !== "leaf";
    }

    /**
     * Invoke `extension.openArduinoExample` command when a Leaf node is clicked.
     */
    public getClickCommand(node: ExampleNode): string {
        return node.kind === "leaf" ? "extension.openArduinoExample" : null;
    }

    public provideRootNode(): ExampleNode {
        return new Root();
    }

    public resolveChildren(node: ExampleNode): Thenable<ExampleNode[]> {
        if (!this.arduinoSettings) {
            vscode.window.showInformationMessage("Arduino is not installed");
            return Promise.resolve([]);
        }

        return new Promise((resolve) => {
            switch (node.kind) {
                case "root":
                    resolve(this.getRootExmapleFolders());
                    break;
                /**
                 * npm3 has flat dependencies, so indirect dependencies are still in `node_modules`.
                 */
                case "node":
                    resolve(this.getSubFolders(node));
                    break;
                case "leaf":
                    resolve([]);
                default:
                    resolve([]);
            }
        });
    }

    private getRootExmapleFolders(): ExampleNode[] {
        const folders = [];
        folders.push(new Node(path.join(this.arduinoSettings.arduinoPath, "examples"), "Built-in Examples"));
        folders.push(new Node(path.join(this.arduinoSettings.arduinoPath, "libraries"), "Examples for any board"));
        folders.push(new Node(this.arduinoSettings.libPath, "Examples from Custom Libraries"));
        // TODO: After integrate with Arduino package management, refine the display name for current board.
        // folders.push(new Node(this.arduinoSettings.libPath, "Examples for current board"));
        return folders;
    }

    /**
     * Iterate the example folders
     */
    private getSubFolders(node: Node): ExampleNode[] {
        let rootNodePath = node.fullPath;
        let items = fs.readdirSync(rootNodePath);
        const subfolders = [];
        if (!items || !items.length) {
            return subfolders;
        }
        // Bypass the exmaples hierarchy for display purpose to make it consistent with the Arduino IDE:
        if (items.filter((item) => item === "examples" && util.directoryExists(path.join(rootNodePath, item))).length > 0) {
            rootNodePath = path.join(rootNodePath, "examples");
            items = fs.readdirSync(rootNodePath);
        }
        items.forEach((item) => {
            const fullItemPath = path.join(rootNodePath, item);
            if (!util.directoryExists(fullItemPath)) {
                return;
            }
            const subItems = fs.readdirSync(fullItemPath);
            if (subItems.filter((subItem) => util.fileExists(path.join(fullItemPath, subItem)) && subItem.endsWith(".ino")).length > 0) {
                subfolders.push(new Leaf(fullItemPath, item));
            } else {
                subfolders.push(new Node(fullItemPath, item));
            }
        });
        return subfolders;
    }
}
