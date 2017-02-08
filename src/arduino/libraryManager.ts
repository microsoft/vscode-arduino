/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";

import * as util from "../common/util";
import { BoardManager } from "./boardManager";
import { IArduinoSettings } from "./settings";

export interface ILibrary {
    name: string;
    // TODO: Make this version aware
    installed: boolean;
    installedPath: string;
    version: string;
    versions: string[];
    aruthor: string;
    maintainer: string;
    sentence: string;
    paragraph: string;
    website: string;
    category: string;
    architectures: string[];
    types: string[];
    builtIn: boolean;
}

export class LibraryManager {

    private _libraries: Map<string, ILibrary>;

    private _sortedLibrary: ILibrary[];

    constructor(private _settings: IArduinoSettings, private _boardManager: BoardManager) {
    }

    public get libraries(): ILibrary[] {
        return this._sortedLibrary;
    }

    public loadLibraries(): void {
        let rootPackgeFolder = this._settings.packagePath;
        let packageContent = fs.readFileSync(path.join(rootPackgeFolder, "library_index.json"), "utf8");
        this.parseLibraryIndex(JSON.parse(packageContent));

        this.loadInstalledLibraries();
        this.sortLibraries();
    }

    private parseLibraryIndex(rawModel: any) {
        this._libraries = new Map<string, ILibrary>();
        rawModel.libraries.forEach((library: ILibrary) => {
            let existingLib = this._libraries.get(library.name);
            if (existingLib) {
                existingLib.versions.push(library.version);
            } else {
                library.versions = [library.version];
                library.builtIn = false;
                library.version = "";
                this._libraries.set(library.name, library);
            }
        });
    }

    private loadInstalledLibraries() {
        let libRoot = this._settings.libPath;

        let installedLibDirs = fs.readdirSync(libRoot);
        installedLibDirs.forEach((libDir) => {
            let sourceLib = this._libraries.get(libDir);
            if (sourceLib) {
                sourceLib.installed = true;
                sourceLib.installedPath = path.join(libRoot, libDir, "src");
            }
        });
    }

    private sortLibraries() {
        this._sortedLibrary = [];
        this._libraries.forEach((_lib) => {
            this._sortedLibrary.push(_lib);
        });
        let targetArch = this._boardManager.currentBoard.platform.architecture;
        this._sortedLibrary = this._sortedLibrary.filter((_lib) => {
            let supportedArch = (<string[]>_lib.architectures).find((arch) => {
                return arch.indexOf(targetArch) >= 0 || arch.indexOf("*") >= 0;
            });
            return supportedArch && supportedArch.length > 0;
        });

        this._sortedLibrary.sort((a, b) => {
            if (a.installed === b.installed) {
                return a.name > b.name ? 1 : -1;
            } else {
                return a.installed ? -1 : 1;
            }
        });
        this.addBuiltInLibs();
    }

    private addBuiltInLibs() {
        let currentBoard = this._boardManager.currentBoard;
        if (!currentBoard) {
            return;
        }
        let rootBoardPath = currentBoard.platform.rootBoardPath;
        let builtInLib = [];
        let builtInLibPath = path.join(rootBoardPath, "libraries");
        if (util.directoryExists(builtInLibPath)) {
            let libDirs = fs.readdirSync(builtInLibPath);
            if (!libDirs || !libDirs.length) {
                return;
            }
            libDirs.forEach((libDir) => {
                builtInLib.push({
                    name: libDir,
                    architectures: [currentBoard.platform.architecture],
                    builtIn: true,
                    installedPath: path.join(builtInLibPath, libDir, "src"),
                    installed: true,
                });
            });
        }

        this._sortedLibrary = builtInLib.concat(this._sortedLibrary);
    }
}
