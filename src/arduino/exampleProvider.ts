// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as vscode from "vscode";

import { DeviceContext } from "../deviceContext";
import { BoardManager } from "./boardManager";
import { ExampleManager, IExampleNode } from "./exampleManager";

export class ExampleProvider implements vscode.TreeDataProvider<ExampleItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<null> = new vscode.EventEmitter<null>();

    // tslint:disable-next-line:member-ordering
    public readonly onDidChangeTreeData: vscode.Event<null> = this._onDidChangeTreeData.event;

    private _examples: IExampleNode[] = null;

    constructor(private _exampleManager: ExampleManager, private _boardManager: BoardManager) {
        this._boardManager.onBoardTypeChanged(() => {
            this.loadData();
        });
    }

    public getTreeItem(element: ExampleItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(element?: ExampleItem): ExampleItem[] {
        if (!this._examples) {
            this.loadData();
            return null;
        }
        if (!element) {
            return this.createExampleItemList(this._examples);
        } else {
            return this.createExampleItemList(element.getChildren());
        }
    }

    private loadData() {
        this._examples = null;
        this._exampleManager.loadExamples().then((examples) => {
            this._examples = examples;
            if (!this.hasAnyExamples(this._examples)) {
                // Reset the examples list to get the welcome message (defined in package.json) to appear.
                this._examples = [];
            }
            this._onDidChangeTreeData.fire(null);
        });
    }

    private hasAnyExamples(nodes?: IExampleNode[]): boolean {
        return nodes && (nodes.find((node) => node.isLeaf || this.hasAnyExamples(node.children)) !== undefined);
    }

    private createExampleItemList(examples: IExampleNode[]): ExampleItem[] {
        const result = [];
        if (examples && examples.length) {
            examples.forEach((example) => {
                result.push(new ExampleItem(example));
            });
        }
        return result;
    }
}

class ExampleItem extends vscode.TreeItem {
    /**
     * These static fields/methods provide delay loading and a single copy of icons.
     */
    private static _folderIcon;
    private static _inoIcon;

    private static getFolderIcon() {
        if (!ExampleItem._folderIcon) {
            ExampleItem._folderIcon = {
                light: ExampleItem.getIconUri("Folder_16x.svg"),
                dark: ExampleItem.getIconUri("Folder_16x_inverse.svg"),
            };
        }
        return ExampleItem._folderIcon;
    }

    private static getInoIcon() {
        if (!ExampleItem._inoIcon) {
            ExampleItem._inoIcon = ExampleItem.getIconUri("ino_16x.svg");
        }
        return ExampleItem._inoIcon;
    }

    private static getIconUri(uriPath: string) {
        const dc = DeviceContext.getInstance();
        return vscode.Uri.file(path.join(dc.extensionPath, "images/examples", uriPath));
    }

    constructor(private _example: IExampleNode) {
        super(_example.name, _example.isLeaf ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        if (_example.isLeaf) {
            this.command = {
                title: "Open Example",
                command: "arduino.openExample",
                arguments: [_example.path],
            };
            this.iconPath = ExampleItem.getInoIcon();
        } else {
            this.iconPath = ExampleItem.getFolderIcon();
        }
    }

    public getChildren(): IExampleNode[] {
        return this._example.children;
    }
}
