/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import * as vscode from "vscode";

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

const BOARD_LINE_RE = /([^\.]+)\.(\S+)=(.+)/;

export class BoardManager {

    private _packages: IPackage[];

    private _platforms: IPlatform[];

    private _installedPlatforms: IPlatform[];

    private _boardStatusBar: vscode.StatusBarItem;

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._boardStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 5);
        this._boardStatusBar.command = "arduino.changeBoardType";
        this._boardStatusBar.tooltip = "Change Board Type";
        this._boardStatusBar.show();

        this.updateStatusBar();
    }

    public loadPackages(): void {
        let rootPackgeFolder = this._settings.packagePath;
        let indexFiles = ["package_index.json"];
        let preferences = this._arduinoApp.preferences;
        if (preferences && preferences.has("boardsmanager.additional.urls")) {
            indexFiles = indexFiles.concat(this.getAddtionalIndexFiles(preferences.get("boardsmanager.additional.urls")));
        }

        this._packages = [];
        this._platforms = [];
        indexFiles.forEach((indexFile) => {
            let packageContent = fs.readFileSync(path.join(rootPackgeFolder, indexFile), "utf8");
            this.parsePackageIndex(JSON.parse(packageContent));
        });

        this.loadInstalledPlatforms();
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
            dc.board = (<any>chosen).entry;
            this.updateStatusBar();
        }
    }

    public get packages(): IPackage[] {
        return this._packages;
    }

    public get platforms(): IPlatform[] {
        return this._platforms;
    }

    public get installedPlatforms(): IPlatform[] {
        return this._installedPlatforms;
    }

    private updateStatusBar(): void {
        const dc = DeviceContext.getIntance();
        this._boardStatusBar.text = dc.board ? dc.board.name : "<Please select the board type>";
    }

    private parsePackageIndex(rawModel: any): void {
        this._packages.concat(rawModel.packages);

        rawModel.packages.forEach((pkg) => {
            pkg.platforms.forEach((plat) => {
                plat.package = pkg;
                let addedPlatform = this._platforms
                    .find((_plat) => _plat.architecture === plat.architecture && _plat.package.name === plat.package.name);
                if (addedPlatform) {
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

    private loadInstalledPlatforms(): void {
        this._installedPlatforms = [];
        const dirs = fs.readdirSync(path.join(this._settings.packagePath, "packages"));
        dirs.forEach((packageName) => {
            let archPath = path.join(this._settings.packagePath, "packages", packageName, "hardware");
            let architectures = fs.readdirSync(archPath);
            architectures.forEach((architecture) => {
                let allVersion = fs.readdirSync(path.join(archPath, architecture));
                let existingPlatform = this._platforms.find((_plat) => _plat.package.name === packageName && _plat.architecture === architecture);
                if (existingPlatform && allVersion && allVersion.length) {
                    existingPlatform.installedVersion = allVersion[0];
                    existingPlatform.rootBoardPath = path.join(archPath, architecture, allVersion[0]);
                    this._installedPlatforms.push(existingPlatform);
                }
            });
        });
    }

    private listBoards(): IBoard[] {
        let boards: Map<string, IBoard> = new Map<string, IBoard>();
        this.installedPlatforms.forEach((plat) => {
            let dir = plat.rootBoardPath;
            let boardContent = fs.readFileSync(path.join(plat.rootBoardPath, "boards.txt"), "utf8");
            boards = new Map([...boards, ...this.parseBoardDescriptorFile(boardContent, plat)]);
            return boards;
        });

        let result = [];
        boards.forEach((b) => {
            result.push(b);
        });
        return result;
    }

    private parseBoardDescriptorFile(boardDescriptor: string, plat: IPlatform): Map<string, IBoard> {
        let result = new Map<string, IBoard>();
        let lines = boardDescriptor.split(/[\r|\r\n|\n]/);
        lines.forEach((line) => {
            if (line.startsWith("#") || line.startsWith("menu.")) {
                return;
            }

            let match = BOARD_LINE_RE.exec(line);
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

    private getAddtionalIndexFiles(addtionalUrls: string): string[] {
        let result = [];
        if (addtionalUrls) {
            let urls = addtionalUrls.split(",");
            urls.forEach((urlString) => {
                let normalizedUrl = url.parse(urlString);
                let indexFileName = normalizedUrl.pathname.substr(normalizedUrl.pathname.lastIndexOf("/") + 1);
                result.push(indexFileName);
            });
        }

        return result;
    }
}
