/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";

import * as util from "../common/util";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./settings";

export interface ILibrary {
    name: string;
    // TODO: Make this version aware
    installed: boolean;
    installedPath: string;
    srcPath: string;
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

    // Sorted library group by board type, then alphabetically.
    private _sortedLibrary: ILibrary[];

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
    }

    public get libraries(): ILibrary[] {
        return this._sortedLibrary;
    }

    public async loadLibraries() {
        this._libraries = new Map<string, ILibrary>();
        this._sortedLibrary = [];

        await this._arduinoApp.boardManager.loadPackages();

        let libraryIndexFilePath = path.join(this._settings.packagePath, "library_index.json");
        if (!util.fileExistsSync(libraryIndexFilePath)) {
            await this._arduinoApp.initializeLibrary();
        }
        let packageContent = fs.readFileSync(libraryIndexFilePath, "utf8");
        this.parseLibraryIndex(JSON.parse(packageContent));

        await this.loadInstalledLibraries();
        await this.sortLibraries();
    }

    private parseLibraryIndex(rawModel: any) {
        rawModel.libraries.forEach((library: ILibrary) => {
            // Arduino install-library program will replace the blank space of the library folder name with underscore,
            // here format library name consistently for better parsing at the next steps.
            const formattedName = library.name.replace(/\s+/g, "_");
            let existingLib = this._libraries.get(formattedName);
            if (existingLib) {
                existingLib.versions.push(library.version);
            } else {
                library.versions = [library.version];
                library.builtIn = false;
                library.version = "";
                this._libraries.set(formattedName, library);
            }
        });
    }

    private async loadInstalledLibraries() {
        let libRoot = this._settings.libPath;

        if (!util.directoryExistsSync(this._settings.libPath)) {
            return;
        }

        let installedLibDirs = util.filterJunk(fs.readdirSync(libRoot));
        for (let libDir of installedLibDirs) {
            let sourceLib = this._libraries.get(libDir);
            if (sourceLib) {
                const properties = <any> await util.parseProperties(path.join(libRoot, libDir, "library.properties"));
                sourceLib.version = util.formatVersion(properties.version);
                sourceLib.installed = true;
                sourceLib.installedPath = path.join(libRoot, libDir);
                sourceLib.srcPath = path.join(libRoot, libDir, "src");
                // If lib src folder doesn't exist, then fallback to the lib root path as source folder.
                sourceLib.srcPath = util.directoryExistsSync(sourceLib.srcPath) ? sourceLib.srcPath : path.join(libRoot, libDir);
            }
        }
    }

    private async sortLibraries() {
        if (!this._arduinoApp.boardManager.currentBoard) {
            return;
        }
        this._libraries.forEach((_lib) => {
            this._sortedLibrary.push(_lib);
        });

        // Filter out not supported library according to the selected board type.
        let targetArch = this._arduinoApp.boardManager.currentBoard.platform.architecture;
        this._sortedLibrary = this._sortedLibrary.filter((_lib) => {
            let supportedArch = (<string[]>_lib.architectures).find((arch) => {
                return arch.indexOf(targetArch) >= 0 || arch.indexOf("*") >= 0;
            });
            return supportedArch && supportedArch.length > 0;
        });

        this._sortedLibrary.sort((a, b) => {
            return a.name > b.name ? 1 : -1;
        });
        await this.addBuiltInLibs();
    }

    private async addBuiltInLibs() {
        let currentBoard = this._arduinoApp.boardManager.currentBoard;
        if (!currentBoard) {
            return;
        }
        let rootBoardPath = currentBoard.platform.rootBoardPath;
        let builtInLib = [];
        let builtInLibPath = path.join(rootBoardPath, "libraries");
        if (util.directoryExistsSync(builtInLibPath)) {
            let libDirs = util.filterJunk(fs.readdirSync(builtInLibPath));
            if (!libDirs || !libDirs.length) {
                return;
            }
            for (let libDir of libDirs) {
                const properties = <any> await util.parseProperties(path.join(builtInLibPath, libDir, "library.properties"));
                properties.version = util.formatVersion(properties.version);
                properties.builtIn = true;
                properties.installedPath = path.join(builtInLibPath, libDir);
                properties.srcPath = path.join(builtInLibPath, libDir, "src");
                // If lib src folder doesn't exist, then fallback to lib root path as source folder.
                properties.srcPath = util.directoryExistsSync(properties.srcPath) ? properties.srcPath : path.join(builtInLibPath, libDir);
                properties.installed = true;
                properties.website = properties.url;
                builtInLib.push(properties);
            }
        }

        this._sortedLibrary = builtInLib.concat(this._sortedLibrary);
    }
}
