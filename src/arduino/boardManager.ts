/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as url from "url";
import * as vscode from "vscode";
import * as util from "../common/util";

import { DeviceContext } from "../deviceContext";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./settings";

/**
 * Interface that represents an individual package contributor from Arduino package index.
 * @interface
 */
export interface IPackage {
    /**
     * Package name
     * @property {string}
     */
    name: string;

    /**
     * Package author email
     * @property {string}
     */
    email: string;

    /**
     * Package maintainer
     * @property {string}
     */
    maintainer: string;

    /**
     * Package support website URL
     * @property {string}
     */
    websiteURL: string;

    /**
     * Help information include online link(s)
     * @property: {any}
     */
    help: any;

    /**
     * Supported platforms that contain in this package.
     * @property {IPlatform[]}
     */
    platforms: IPlatform[];

    /**
     * Provided tools that contain in this package.
     */
    tools: Object[];
}

/**
 * Interface that represents the supported platforms from the contribution packages.
 *
 * The interface has merged all the supported versions.
 *
 * @interface
 */
export interface IPlatform {
    /**
     * Platform name
     * @property {string}
     */
    name: string;

    /**
     * Targeting architecture of the platform.
     * @property {string}
     */
    architecture: string;

    /**
     * Category, can be these values: "Arduino", "Arduino Certified", "Partner", "ESP8266", ...
     * @property {string}
     */
    category: string;

    /**
     * Provide URL of the platform
     * @property {string}
     */
    url: string;

    /**
     * Whether is the default platform come with the installation.
     * @property {boolean}
     */
    defaultPlatform?: boolean;

    /**
     * The raw version when load the object from json object. This value should not be used after the
     * platforms information has been parsed.
     * @property {string}
     */
    version: string;

    /**
     * All supported version fro this platform.
     * @property {string[]}
     */
    versions: string[];

    /**
     * Installed platform on the local Arduino IDE
     * @property {string}
     */
    installedVersion: string;

    /**
     * Root path that contains all the files, board description under the specified version.
     * @property {string}
     */
    rootBoardPath: string;

    /**
     * The board desriptor information supported by this platform.
     * @property {IBoard[]}
     */
    boards: any[];

    /**
     * Help information object include online link(s).
     * @property {any}
     */
    help: any;

    /**
     * Parent package information
     * @property {IPackage}
     */
    package: IPackage;
}

/**
 * Interface for classes that represent an Arduino supported board.
 *
 * @interface
 */
export interface IBoard {
    /**
     * Board aliasname for Arduino compilation such as `huzzah`, `yun`
     * @property {string}
     */
    board: string;

    /**
     * The human readable name displayed on the Arduino IDE Boards Manager
     * @property {string}
     */
    name?: string;

    /**
     * Board specified parameters
     * @property {Map}
     */
    parameters?: Map<string, string>;

    /**
     * Reference to the platform that contains this board.
     * @prop {IPlatform}
     */
    platform: IPlatform;
}

export class BoardManager {

    private _packages: IPackage[];

    private _platforms: IPlatform[];

    private _installedPlatforms: IPlatform[];

    private _boards: Map<string, IBoard>;

    private _boardStatusBar: vscode.StatusBarItem;

    private _currentBoard: IBoard;

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._boardStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 5);
        this._boardStatusBar.command = "arduino.changeBoardType";
        this._boardStatusBar.tooltip = "Change Board Type";
    }

    public async loadPackages(update: boolean = false) {
        this._packages = [];
        this._platforms = [];
        this._installedPlatforms = [];

        if (update) { // Update index files.
            await this._arduinoApp.setPref("boardsmanager.additional.urls", this.getAdditionalUrls().join(","));
            await this._arduinoApp.initialize(true);
        }

        // Parse package index files.
        const indexFiles = ["package_index.json"].concat(this.getAddtionalIndexFiles());
        const rootPackgeFolder = this._settings.packagePath;
        for (let indexFile of indexFiles) {
            if (!update && !util.fileExistsSync(path.join(rootPackgeFolder, indexFile))) {
                await this._arduinoApp.setPref("boardsmanager.additional.urls", this.getAdditionalUrls().join(","));
                await this._arduinoApp.initialize(true);
            }
            let packageContent = fs.readFileSync(path.join(rootPackgeFolder, indexFile), "utf8");
            this.parsePackageIndex(JSON.parse(packageContent));
        }

        // Load default platforms from arduino installation directory and user manually installed platforms.
        this.loadInstalledPlatforms();

        // Load all supported boards type.
        this.loadInstalledBoards();
        this.updateStatusBar();
        this._boardStatusBar.show();
    }

    public async changeBoardType() {
        let supportedBoardTypes = this.listBoards();
        if (supportedBoardTypes.length === 0) {
            vscode.window.showInformationMessage("No supported board is available.");
            return;
        }
        // TODO:? Add separator item between different platforms.
        let chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>supportedBoardTypes.map((entry): vscode.QuickPickItem => {
            return <vscode.QuickPickItem>{
                label: entry.name,
                description: entry.platform.name,
                entry,
            };
        }).sort((a, b): number => {
            if (a.description === b.description) {
                return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
            } else {
                return a.description > b.description ? 1 : -1;
            }
        }));
        if (chosen && chosen.label) {
            const dc = DeviceContext.getIntance();
            dc.board = this.getBoardKey((<any>chosen).entry);
            this._currentBoard = (<any>chosen).entry;
            this._boardStatusBar.text = chosen.label;
            this._arduinoApp.addLibPath(null);
        }
    }

    public get packages(): IPackage[] {
        return this._packages;
    }

    public get platforms(): IPlatform[] {
        return this._platforms;
    }

    public get installedBoards(): Map<string, IBoard> {
        return this._boards;
    }

    public get currentBoard(): IBoard {
        return this._currentBoard;
    }

    public getInstalledPlatforms() {
        // Always using manually installed platforms to overwrite the same platform from arduino installation directory.
        const installedPlatforms = this.getDefaultPlatforms();
        const manuallyInstalled = this.getManuallyInstalledPlatforms();
        manuallyInstalled.forEach((plat) => {
            const find = installedPlatforms.find((_plat) => {
                return _plat.packageName === plat.packageName && _plat.architecture === plat.architecture;
            });
            if (!find) {
                installedPlatforms.push(plat);
            } else {
                find.defaultPlatform = plat.defaultPlatform;
                find.version = plat.version;
                find.rootBoardPath = plat.rootBoardPath;
            }
        });
        return installedPlatforms;
    }

    private updateStatusBar(): void {
        const dc = DeviceContext.getIntance();
        let selectedBoard = this._boards.get(dc.board);
        if (selectedBoard) {
            this._currentBoard = selectedBoard;
            this._boardStatusBar.text = selectedBoard.name;
        } else {
            this._boardStatusBar.text = "<Select Board Type>";
        }
    }

    private parsePackageIndex(rawModel: any): void {
        this._packages.concat(rawModel.packages);

        rawModel.packages.forEach((pkg) => {
            pkg.platforms.forEach((plat) => {
                plat.package = pkg;
                let addedPlatform = this._platforms
                    .find((_plat) => _plat.architecture === plat.architecture && _plat.package.name === plat.package.name);
                if (addedPlatform) {
                    // union boards from all versions.
                    addedPlatform.boards = util.union(addedPlatform.boards, plat.boards, (a, b) => {
                        return a.name === b.name;
                    });
                    addedPlatform.versions.push(plat.version);
                } else {
                    plat.versions = [plat.version];
                    // Clear the version information since the plat will be used to contain all supported versions.
                    plat.version = "";
                    this._platforms.push(plat);
                }
            });
        });
    }

    private loadInstalledPlatforms() {
        const installed = this.getInstalledPlatforms();
        installed.forEach((platform) => {
            let existingPlatform = this._platforms.find((_plat) => {
                return _plat.package.name === platform.packageName && _plat.architecture === platform.architecture;
            });
            if (existingPlatform) {
                existingPlatform.defaultPlatform = platform.defaultPlatform;
                if (!existingPlatform.installedVersion) {
                    existingPlatform.installedVersion = platform.version;
                    existingPlatform.rootBoardPath = platform.rootBoardPath;
                    this._installedPlatforms.push(existingPlatform);
                }
            }
        });
    }

    // Default arduino package information from arduino installation directory.
    private getDefaultPlatforms() {
        const defaultPlatforms = [];
        try {
            let packageBundled = fs.readFileSync(path.join(this._settings.defaultPackagePath, "package_index_bundled.json"), "utf8");
            if (!packageBundled) {
                return;
            }
            let bundledObject = JSON.parse(packageBundled);
            if (bundledObject && bundledObject.packages) {
                for (let pkg of bundledObject.packages) {
                    for (let platform of pkg.platforms) {
                        if (platform.version) {
                            defaultPlatforms.push({
                                packageName: pkg.name,
                                architecture: platform.architecture,
                                version: platform.version,
                                rootBoardPath: path.join(this._settings.defaultPackagePath, pkg.name, platform.architecture),
                                defaultPlatform: true,
                            });
                        }
                    }
                }
            }
        } catch (ex) {
        }
        return defaultPlatforms;
    }

    // User manually installed packages.
    private getManuallyInstalledPlatforms() {
        const manuallyInstalled = [];
        let rootPackagePath = path.join(path.join(this._settings.packagePath, "packages"));
        if (!util.directoryExistsSync(rootPackagePath)) {
            return manuallyInstalled;
        }
        const dirs = util.filterJunk(util.readdirSync(rootPackagePath, true)); // in Mac, filter .DS_Store file.
        for (let packageName of dirs) {
            let archPath = path.join(this._settings.packagePath, "packages", packageName, "hardware");
            if (!util.directoryExistsSync(archPath)) {
                continue;
            }
            let architectures = util.filterJunk(fs.readdirSync(archPath));
            architectures.forEach((architecture) => {
                let allVersion = util.filterJunk(fs.readdirSync(path.join(archPath, architecture)));
                if (allVersion && allVersion.length) {
                    manuallyInstalled.push({
                        packageName,
                        architecture,
                        version: allVersion[0],
                        rootBoardPath: path.join(archPath, architecture, allVersion[0]),
                        defaultPlatform: false,
                    });
                }
            });
        }
        return manuallyInstalled;
    }

    private loadInstalledBoards(): void {
        this._boards = new Map<string, IBoard>();
        this._installedPlatforms.forEach((plat) => {
            let dir = plat.rootBoardPath;
            if (util.fileExistsSync(path.join(plat.rootBoardPath, "boards.txt"))) {
                let boardContent = fs.readFileSync(path.join(plat.rootBoardPath, "boards.txt"), "utf8");
                let res = this.parseBoardDescriptorFile(boardContent, plat);
                res.forEach((bd) => {
                    let fullKey = this.getBoardKey(bd);
                    this._boards.set(fullKey, bd);
                });
            }
        });
    }

    private listBoards(): IBoard[] {
        let result = [];
        this._boards.forEach((b) => {
            result.push(b);
        });
        return result;
    }

    private parseBoardDescriptorFile(boardDescriptor: string, plat: IPlatform): Map<string, IBoard> {
        const boardLineRegex = /([^\.]+)\.(\S+)=(.+)/;

        let result = new Map<string, IBoard>();
        let lines = boardDescriptor.split(/[\r|\r\n|\n]/);

        lines.forEach((line) => {
            // Ignore comments and menu discription lines.
            if (line.startsWith("#") || line.startsWith("menu.")) {
                return;
            }
            let match = boardLineRegex.exec(line);
            if (match && match.length > 3) {
                let boardObject = result.get(match[1]);
                if (!boardObject) {
                    boardObject = {
                        board: match[1],
                        platform: plat,
                        parameters: new Map<string, string>(),
                    };
                    result.set(boardObject.board, boardObject);
                }
                if (match[2] === "name") {
                    boardObject.name = match[3].trim();
                } else {
                    boardObject.parameters.set(match[2], match[3]);
                }
            }
        });
        return result;
    }

    private getAddtionalIndexFiles(): string[] {
        let result = [];
        let urls = this.getAdditionalUrls();

        urls.forEach((urlString) => {
            if (!urlString) {
                return;
            }
            let normalizedUrl = url.parse(urlString);
            if (!normalizedUrl) {
                return;
            }
            let indexFileName = normalizedUrl.pathname.substr(normalizedUrl.pathname.lastIndexOf("/") + 1);
            result.push(indexFileName);
        });

        return result;
    }

    private getAdditionalUrls(): string[] {
        let additionalUrls = this._settings.additionalUrls;
        let preferences = this._arduinoApp.preferences;
        if (!additionalUrls && preferences && preferences.has("boardsmanager.additional.urls")) {
            additionalUrls = preferences.get("boardsmanager.additional.urls");
        }
        let urls = additionalUrls;
        if (additionalUrls) {
            if (!Array.isArray(urls) && typeof urls === "string") {
                urls = (<string>additionalUrls).split(",");
            }
        } else {
            return [];
        }
        return <string[]>urls;
    }
    /**
     * @returns {string} Return board key in format packageName:arch:boardName
     */
    private getBoardKey(board: IBoard) {
        return `${board.platform.package.name}:${board.platform.architecture}:${board.board}`;
    }
}
