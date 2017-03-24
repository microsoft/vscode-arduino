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
import { Board, parseBoardDescriptor } from "./board";
import { IBoard, IPackage, IPlatform } from "./package";
import { IArduinoSettings } from "./settings";

export class BoardManager {

    private _packages: IPackage[];

    private _platforms: IPlatform[];

    private _installedPlatforms: IPlatform[];

    private _boards: Map<string, IBoard>;

    private _boardStatusBar: vscode.StatusBarItem;

    private _configStatusBar: vscode.StatusBarItem;

    private _currentBoard: IBoard;

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._boardStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 5);
        this._boardStatusBar.command = "arduino.changeBoardType";
        this._boardStatusBar.tooltip = "Change Board Type";

        this._configStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 6);
        this._configStatusBar.command = "arduino.showBoardConfig";
        this._configStatusBar.text = "Config";
        this._configStatusBar.tooltip = "Config board";
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
            dc.board = ((<any>chosen).entry).key;
            this._currentBoard = (<any>chosen).entry;
            dc.configuration = this._currentBoard.customConfig;
            if (dc.configuration) {
                this._configStatusBar.show();
            } else {
                this._configStatusBar.hide();
            }
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

    public getInstalledPlatforms(): any[] {
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
            if (dc.configuration) {
                this._configStatusBar.show();
                this._currentBoard.loadConfig(dc.configuration);
            } else {
                this._configStatusBar.hide();
            }
        } else {
            this._boardStatusBar.text = "<Select Board Type>";
            this._configStatusBar.hide();
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
    private getDefaultPlatforms(): any[] {
        const defaultPlatforms = [];
        try {
            let packageBundled = fs.readFileSync(path.join(this._settings.defaultPackagePath, "package_index_bundled.json"), "utf8");
            if (!packageBundled) {
                return defaultPlatforms;
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
    private getManuallyInstalledPlatforms(): any[] {
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
                let res = parseBoardDescriptor(boardContent, plat);
                res.forEach((bd) => {
                    this._boards.set(bd.key, bd);
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
}
