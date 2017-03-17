/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
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
    supported: boolean;
}

export class LibraryManager {
    private _libraryMap: Map<string, ILibrary>;

    private _libraries: ILibrary[];

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
    }

    public get libraries(): ILibrary[] {
        return this._libraries;
    }

    public async loadLibraries() {
        this._libraryMap = new Map<string, ILibrary>();
        this._libraries = [];

        await this._arduinoApp.boardManager.loadPackages();

        let libraryIndexFilePath = path.join(this._settings.packagePath, "library_index.json");
        if (!util.fileExistsSync(libraryIndexFilePath)) {
            await this._arduinoApp.initializeLibrary();
        }
        let packageContent = fs.readFileSync(libraryIndexFilePath, "utf8");
        this.parseLibraryIndex(JSON.parse(packageContent));

        await this.loadIdeLibraries();
        await this.loadInstalledLibraries();
        const builtinLibs = await this.loadBoardLibraries();
        this._libraries = Array.from(this._libraryMap.values());
        this._libraries = this._libraries.concat(builtinLibs);
        this.tagSupportedLibraries();
    }

    private parseLibraryIndex(rawModel: any) {
        rawModel.libraries.forEach((library: ILibrary) => {
            // Arduino install-library program will replace the blank space of the library folder name with underscore,
            // here format library name consistently for better parsing at the next steps.
            const formattedName = library.name.replace(/\s+/g, "_");
            let existingLib = this._libraryMap.get(formattedName);
            if (existingLib) {
                existingLib.versions.push(library.version);
            } else {
                library.versions = [library.version];
                library.builtIn = false;
                library.version = "";
                this._libraryMap.set(formattedName, library);
            }
        });
    }

    private async loadIdeLibraries() {
        const arduinoPath = this._settings.arduinoPath;
        let ideLibraryPath = path.join(arduinoPath, "libraries"); // linux and win32
        if (os.platform() === "darwin") {
            ideLibraryPath = path.join(arduinoPath, "Arduino.app/Contents/Java/libraries");
        }
        const ideLibraries = util.filterJunk(util.readdirSync(ideLibraryPath, true));
        for (let libDir of ideLibraries) {
            if (util.fileExistsSync(path.join(ideLibraryPath, libDir, "library.properties"))) {
                const properties = <any>await util.parseProperties(path.join(ideLibraryPath, libDir, "library.properties"));
                const formattedName = properties.name.replace(/\s+/g, "_");
                let sourceLib = this._libraryMap.get(formattedName);
                if (sourceLib) {
                    sourceLib.version = util.formatVersion(properties.version);
                    sourceLib.builtIn = true;
                    sourceLib.installed = true;
                    sourceLib.installedPath = path.join(ideLibraryPath, libDir);
                    sourceLib.srcPath = path.join(ideLibraryPath, libDir, "src");
                    // If lib src folder doesn't exist, then fallback to the lib root path as source folder.
                    sourceLib.srcPath = util.directoryExistsSync(sourceLib.srcPath) ? sourceLib.srcPath : path.join(ideLibraryPath, libDir);
                }
            }
        }
    }

    private async loadInstalledLibraries() {
        const libRoot = this._settings.libPath;
        if (!util.directoryExistsSync(this._settings.libPath)) {
            return;
        }

        let installedLibDirs = util.filterJunk(util.readdirSync(libRoot, true));
        for (let libDir of installedLibDirs) {
            if (util.fileExistsSync(path.join(libRoot, libDir, "library.properties"))) {
                const properties = <any>await util.parseProperties(path.join(libRoot, libDir, "library.properties"));
                const formattedName = properties.name.replace(/\s+/g, "_");
                let sourceLib = this._libraryMap.get(formattedName);
                if (sourceLib) {
                    sourceLib.version = util.formatVersion(properties.version);
                    sourceLib.builtIn = false;
                    sourceLib.installed = true;
                    sourceLib.installedPath = path.join(libRoot, libDir);
                    sourceLib.srcPath = path.join(libRoot, libDir, "src");
                    // If lib src folder doesn't exist, then fallback to the lib root path as source folder.
                    sourceLib.srcPath = util.directoryExistsSync(sourceLib.srcPath) ? sourceLib.srcPath : path.join(libRoot, libDir);
                }
            }
        }
    }

    private async loadBoardLibraries() {
        let builtinLibs = [];
        const librarySet = new Set(this._libraryMap.keys());
        for (let board of this._arduinoApp.boardManager.platforms) {
            if (board.installedVersion) {
                const libs = await this.parseBoardLibraries(board.rootBoardPath, board.architecture, librarySet);
                builtinLibs = builtinLibs.concat(libs);
            }
        }
        return builtinLibs;
    }

    private async parseBoardLibraries(rootBoardPath, architecture, librarySet: Set<any>) {
        let builtInLib = [];
        let builtInLibPath = path.join(rootBoardPath, "libraries");
        if (util.directoryExistsSync(builtInLibPath)) {
            let libDirs = util.filterJunk(util.readdirSync(builtInLibPath, true));
            if (!libDirs || !libDirs.length) {
                return builtInLib;
            }
            for (let libDir of libDirs) {
                if (!util.fileExistsSync(path.join(builtInLibPath, libDir, "library.properties"))) {
                    const properties = <ILibrary>{};
                    properties.name = libDir;
                    properties.builtIn = true;
                    properties.installedPath = path.join(builtInLibPath, libDir);
                    properties.srcPath = path.join(builtInLibPath, libDir, "src");
                    // If lib src folder doesn't exist, then fallback to lib root path as source folder.
                    properties.srcPath = util.directoryExistsSync(properties.srcPath) ? properties.srcPath : path.join(builtInLibPath, libDir);
                    properties.installed = true;
                    properties.architectures = [architecture];
                    // For libraries with the same name, append architecture info to name to avoid duplication.
                    if (librarySet.has(properties.name)) {
                        properties.name = properties.name + "(" + architecture + ")";
                    }
                    librarySet.add(properties.name);
                    builtInLib.push(properties);
                } else {
                    let properties = <any>await util.parseProperties(path.join(builtInLibPath, libDir, "library.properties"));
                    properties.version = util.formatVersion(properties.version);
                    properties.builtIn = true;
                    properties.installedPath = path.join(builtInLibPath, libDir);
                    properties.srcPath = path.join(builtInLibPath, libDir, "src");
                    // If lib src folder doesn't exist, then fallback to lib root path as source folder.
                    properties.srcPath = util.directoryExistsSync(properties.srcPath) ? properties.srcPath : path.join(builtInLibPath, libDir);
                    properties.installed = true;
                    properties.website = properties.url;
                    properties.architectures = [architecture];
                    // For libraries with the same name, append architecture info to name to avoid duplication.
                    if (librarySet.has(properties.name)) {
                        properties.name = properties.name + "(" + architecture + ")";
                    }
                    librarySet.add(properties.name);
                    builtInLib.push(properties);
                }
            }
        }
        return builtInLib;
    }

    private tagSupportedLibraries() {
        const currentBoard = this._arduinoApp.boardManager.currentBoard;
        if (!currentBoard) {
            return;
        }
        let targetArch = currentBoard.platform.architecture;
        this._libraries.forEach((library) => {
            library.supported = !!(<string[]>library.architectures).find((arch) => {
                return arch.indexOf(targetArch) >= 0 || arch.indexOf("*") >= 0;
            });
        });
    }
}
