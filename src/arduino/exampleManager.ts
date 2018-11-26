// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as util from "../common/util";

import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./arduinoSettings";

export interface IExampleNode {
    name: string;
    path: string;
    isLeaf: boolean;
    children: IExampleNode[];
}

export class ExampleManager {

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
    }

    public async loadExamples() {
        const examples = [];
        // load Built-in Examples from examples folder under arduino installation directory.
        examples.push({
            name: "Built-in Examples",
            path: this._settings.defaultExamplePath,
            children: this.parseExamples(this._settings.defaultExamplePath),
        });

        // load Examples from default libraries under arduino installation directory.
        const examplesFromDefaultLibraries = await this.parseExamplesFromLibrary(this._settings.defaultLibPath, true);
        if (examplesFromDefaultLibraries.length) {
            examples.push({
                name: "Examples for any board",
                path: this._settings.defaultLibPath,
                children: examplesFromDefaultLibraries,
            });
        }

        // load Examples from current board's firmware package directory.
        if (this._arduinoApp.boardManager.currentBoard) {
            const currentBoard = this._arduinoApp.boardManager.currentBoard;
            const currentBoardLibrariesPath = path.join(currentBoard.platform.rootBoardPath, "libraries");
            const examplesFromCurrentBoard = await this.parseExamplesFromLibrary(currentBoardLibrariesPath, false);
            if (examplesFromCurrentBoard.length) {
                examples.push({
                    name: `Examples for ${currentBoard.name}`,
                    path: currentBoardLibrariesPath,
                    children: examplesFromCurrentBoard,
                });
            }
        }

        // load Examples from Custom Libraries
        const customLibrariesPath = path.join(this._settings.sketchbookPath, "libraries");
        const examplesFromCustomLibraries = await this.parseExamplesFromLibrary(customLibrariesPath, true, true);
        if (examplesFromCustomLibraries.length) {
            examples.push({
                name: "Examples from Custom Libraries",
                path: customLibrariesPath,
                children: examplesFromCustomLibraries,
            });
        }

        // load Examples from user's workspace
        const sketchesPath = path.join(this._settings.sketchbookPath, "sketches");
        const examplesFromSketches = await this.parseExamples(sketchesPath);
        if (examplesFromSketches.length) {
            examples.push({
                name: "Workspace",
                path: sketchesPath,
                children: examplesFromSketches,
            });
        }

        return examples;
    }

    private parseExamples(rootPath: string): IExampleNode[] {
        if (!util.directoryExistsSync(rootPath)) {
            return [];
        }
        const exampleFolders = glob.sync(path.join(rootPath, "**/**/"));
        // exampleFolders looks like as follows:
        // ["C:/Program Files (x86)/Arduino/examples/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/AnalogReadSerial/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/BareMinimum/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/Blink/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/DigitalReadSerial/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/Fade/",
        //  "C:/Program Files (x86)/Arduino/examples/01.Basics/ReadAnalogVoltage/",
        //  "C:/Program Files (x86)/Arduino/examples/02.Digital/",
        // ]
        const rootNode = <IExampleNode> {
            children: [],
        };
        const exampleMap = new Map<string, IExampleNode>();
        exampleMap.set(path.resolve(exampleFolders[0]), rootNode);
        for (let i = 1; i < exampleFolders.length; i++) {
            const currentPath = path.resolve(exampleFolders[i]);
            const parentPath = path.resolve(path.dirname(exampleFolders[i]));
            const parentExample = exampleMap.get(parentPath);
            if (parentExample && !parentExample.isLeaf) {
                const currentExample = <IExampleNode> {
                    name: path.basename(exampleFolders[i]),
                    path: currentPath,
                    // If there is *.ino files existing in current folder, then mark this folder as leaf node.
                    isLeaf: this.isExampleFolder(currentPath),
                    children: [],
                };
                exampleMap.set(currentPath, currentExample);
                parentExample.children.push(currentExample);
            }
        }

        return rootNode.children;
    }

    private async parseExamplesFromLibrary(rootPath: string, checkCompatibility: boolean, categorizeIncompatible: boolean = false) {
        const examples = [];
        const inCompatibles = [];
        if (!util.directoryExistsSync(rootPath)) {
            return [];
        }
        const libraries = util.readdirSync(rootPath, true);
        for (const library of libraries) {
            const propertiesFile = path.join(rootPath, library, "library.properties");
            if (checkCompatibility && util.fileExistsSync(propertiesFile)) {
                const properties = <any>await util.parseProperties(propertiesFile);
                const children = this.parseExamples(path.join(rootPath, library, "examples"));
                if (children.length) {
                    // When missing architectures field in library.properties, fall it back to "*".
                    if (this.isSupported(properties.architectures || "*")) {
                        examples.push({
                            name: library,
                            path: path.join(rootPath, library),
                            children,
                        });
                    } else if (categorizeIncompatible) {
                        inCompatibles.push({
                            name: library,
                            path: path.join(rootPath, library),
                            children,
                        });
                    }
                }
            } else {
                const children = this.parseExamples(path.join(rootPath, library, "examples"));
                if (children.length) {
                    examples.push({
                        name: library,
                        path: path.join(rootPath, library),
                        children,
                    });
                }
            }
        }

        if (categorizeIncompatible && inCompatibles.length) {
            examples.push({
                name: "INCOMPATIBLE",
                path: "INCOMPATIBLE",
                children: inCompatibles,
            });
        }
        return examples;
    }

    private isExampleFolder(dirname) {
        const items = fs.readdirSync(dirname);
        const ino = items.find((item) => {
            return util.isArduinoFile(path.join(dirname, item));
        });
        return !!ino;
    }

    private isSupported(architectures) {
        if (!architectures) {
            return false;
        }
        const currentBoard = this._arduinoApp.boardManager.currentBoard;
        if (!currentBoard) {
            return true;
        }

        const targetArch = currentBoard.platform.architecture;
        return architectures.indexOf(targetArch) >= 0 || architectures.indexOf("*") >= 0;
    }
}
