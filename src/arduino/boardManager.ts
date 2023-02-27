// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import * as vscode from "vscode";
import * as util from "../common/util";

import * as constants from "../common/constants";
import { arduinoChannel } from "../common/outputChannel";
import { versionCompare } from "../common/sharedUtilities/utils";
import { DeviceContext } from "../deviceContext";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./arduinoSettings";
import { boardEqual, parseBoardDescriptor } from "./board";
import { BoardConfigResult, IBoard, IPackage, IPlatform, IProgrammer } from "./package";
import { parseProgrammerDescriptor } from "./programmer";
import { VscodeSettings } from "./vscodeSettings";

export class BoardManager {

    private _packages: IPackage[];

    private _platforms: IPlatform[];

    private _programmers: Map<string, IProgrammer>;

    private _installedPlatforms: IPlatform[];

    private _boards: Map<string, IBoard>;

    private _boardConfigStatusBar: vscode.StatusBarItem;

    private _currentBoard: IBoard;

    private _onBoardTypeChanged = new vscode.EventEmitter<void>();

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._boardConfigStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.BOARD);
        this._boardConfigStatusBar.command = "arduino.showBoardConfig";
        this._boardConfigStatusBar.tooltip = "Show Board Config";
    }

    public async loadPackages(update: boolean = false) {
        this._packages = [];
        this._platforms = [];
        this._installedPlatforms = [];

        const additionalUrls = this._arduinoApp.getAdditionalUrls();
        if (update) { // Update index files.
            await this.setPreferenceUrls(additionalUrls);
            await this._arduinoApp.initialize(true);
        }

        // Parse package index files.
        const indexFiles = ["package_index.json"].concat(additionalUrls);
        const rootPackageFolder = this._settings.packagePath;
        for (const indexFile of indexFiles) {
            const indexFileName = this.getIndexFileName(indexFile);
            if (!indexFileName) {
                continue;
            }
            if (!update && !util.fileExistsSync(path.join(rootPackageFolder, indexFileName))) {
                await this.setPreferenceUrls(additionalUrls);
                await this._arduinoApp.initialize(true);
            }
            this.loadPackageContent(indexFileName);
        }

        // Load default platforms from arduino installation directory and user manually installed platforms.
        this.loadInstalledPlatforms();

        // Load all supported board types
        this.loadInstalledBoards();
        this.loadInstalledProgrammers();
        this.updateStatusBar();
        this._boardConfigStatusBar.show();

        const dc = DeviceContext.getInstance();
        dc.onChangeBoard(() => this.onDeviceContextBoardChange());
        dc.onChangeConfiguration(() => this.onDeviceContextConfigurationChange());

        // load initial board from DeviceContext by emulating
        // a board change event.
        this.onDeviceContextBoardChange();
        this.updateStatusBar(true);
    }

    public async changeBoardType() {
        const supportedBoardTypes = this.listBoards();
        if (supportedBoardTypes.length === 0) {
            vscode.window.showInformationMessage("No supported board is available.");
            return;
        }
        // TODO:? Add separator item between different platforms.
        const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>supportedBoardTypes.map((entry): vscode.QuickPickItem => {
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
        }), { placeHolder: "Select board type" });
        if (chosen && chosen.label) {
            this.doChangeBoardType((<any>chosen).entry);
        }
    }

    public async updatePackageIndex(indexUri: string): Promise<boolean> {
        let allUrls = this._arduinoApp.getAdditionalUrls();
        if (!(allUrls.indexOf(indexUri) >= 0)) {
            allUrls = allUrls.concat(indexUri);
            VscodeSettings.getInstance().updateAdditionalUrls(allUrls);
            await this._arduinoApp.setPref("boardsmanager.additional.urls", this._arduinoApp.getAdditionalUrls().join(","));
        }
        return true;
    }

    public get onBoardTypeChanged(): vscode.Event<void> {
        return this._onBoardTypeChanged.event;
    }

    public doChangeBoardType(targetBoard: IBoard) {
        const dc = DeviceContext.getInstance();

        if (dc.board === targetBoard.key) {
            return;
        }

        // Resetting the board first that we don't overwrite the configuration
        // of the previous board.
        this._currentBoard = null;
        // This will cause a configuration changed event which will have no
        // effect because no current board is set.
        dc.configuration = targetBoard.customConfig;
        // This will generate a device context board event which will set the
        // correct board and configuration. We know that it will trigger - we
        // made sure above that the boards actually differ
        dc.board = targetBoard.key;
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

    public get installedProgrammers(): Map<string, IProgrammer> {
        return this._programmers;
    }

    public get currentBoard(): IBoard {
        return this._currentBoard;
    }

    public getInstalledPlatforms(): any[] {
        // Always using manually installed platforms to overwrite the same platform from arduino installation directory.
        const installedPlatforms = this.getDefaultPlatforms();

        const mergePlatform = (plat) => {
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
        };

        const customPlatforms = this.getCustomPlatforms();
        const manuallyInstalled = this.getManuallyInstalledPlatforms();

        customPlatforms.forEach(mergePlatform);
        manuallyInstalled.forEach(mergePlatform);

        return installedPlatforms;
    }

    public loadPackageContent(indexFile: string): void {
        const indexFileName = this.getIndexFileName(indexFile);
        if (!util.fileExistsSync(path.join(this._settings.packagePath, indexFileName))) {
            return;
        }
        const packageContent = fs.readFileSync(path.join(this._settings.packagePath, indexFileName), "utf8");
        if (!packageContent) {
            return;
        }

        let rawModel = null;
        try {
            rawModel = JSON.parse(packageContent);
        } catch (ex) {
            arduinoChannel.error(`Invalid json file "${path.join(this._settings.packagePath, indexFileName)}".
            Suggest to remove it manually and allow boardmanager to re-download it.`);
            return;
        }

        if (!rawModel || !rawModel.packages || !rawModel.packages.length) {
            return;
        }

        this._packages = this._packages.concat(rawModel.packages);

        rawModel.packages.forEach((pkg) => {
            pkg.platforms.forEach((plat) => {
                plat.package = pkg;
                const addedPlatform = this._platforms
                    .find((_plat) => _plat.architecture === plat.architecture && _plat.package.name === plat.package.name);
                if (addedPlatform) {
                    // union boards from all versions.
                    // We should not union boards: https://github.com/Microsoft/vscode-arduino/issues/414
                    // addedPlatform.boards = util.union(addedPlatform.boards, plat.boards, (a, b) => {
                    //     return a.name === b.name;
                    // });

                    // Check if platform name is the same, if not, we should use the name from the latest version.
                    if (addedPlatform.name !== plat.name) {
                        addedPlatform.name = plat.name;
                    }

                    addedPlatform.versions.push(plat.version);
                    // Check if this is the latest version. Platforms typically support more boards in later versions.
                    addedPlatform.versions.sort(versionCompare);
                    if (plat.version === addedPlatform.versions[addedPlatform.versions.length - 1]) {
                        addedPlatform.boards = plat.boards;
                    }
                } else {
                    plat.versions = [plat.version];
                    // Clear the version information since the plat will be used to contain all supported versions.
                    plat.version = "";
                    this._platforms.push(plat);
                }
            });
        });
    }

    public updateInstalledPlatforms(pkgName: string, arch: string) {
        const archPath = path.join(this._settings.packagePath, "packages", pkgName, "hardware", arch);

        const allVersion = util.filterJunk(util.readdirSync(archPath, true));
        if (allVersion && allVersion.length) {
            const newPlatform = {
                packageName: pkgName,
                architecture: arch,
                version: allVersion[0],
                rootBoardPath: path.join(archPath, allVersion[0]),
                defaultPlatform: false,
            };

            const existingPlatform = this._platforms.find((_plat) => {
                return _plat.package.name === pkgName && _plat.architecture === arch;
            });
            if (existingPlatform) {
                existingPlatform.defaultPlatform = newPlatform.defaultPlatform;
                if (!existingPlatform.installedVersion) {
                    existingPlatform.installedVersion = newPlatform.version;
                    existingPlatform.rootBoardPath = newPlatform.rootBoardPath;
                    this._installedPlatforms.push(existingPlatform);
                }
                this.loadInstalledBoardsFromPlatform(existingPlatform);
                this.loadInstalledProgrammersFromPlatform(existingPlatform);
            }
        }
    }

    private updateStatusBar(show: boolean = true): void {
        if (show) {
            this._boardConfigStatusBar.show();
            if (this._currentBoard) {
                this._boardConfigStatusBar.text = this._currentBoard.name;
            } else {
                this._boardConfigStatusBar.text = "<Select Board Type>";
            }
        } else {
            this._boardConfigStatusBar.hide();
        }
    }

    /**
     * Event callback if DeviceContext detected a new board - either when
     * loaded from configuration file or when set by the doChangeBoardType
     * member.
     */
    private onDeviceContextBoardChange() {
        const dc = DeviceContext.getInstance();
        const newBoard = this._boards.get(dc.board);
        if (boardEqual(newBoard, this._currentBoard)) {
            return;
        }
        if (newBoard) {
            this._currentBoard = newBoard;
            if (dc.configuration) {
                // In case the configuration is incompatible, we reset it as
                // setting partially valid configurations can lead to nasty
                // surprises. When setting a new board this is acceptable
                const r = this._currentBoard.loadConfig(dc.configuration);
                if (r !== BoardConfigResult.Success && r !== BoardConfigResult.SuccessNoChange) {
                    this._currentBoard.resetConfig();
                    // we don't reset dc.configuration to give the user a
                    // chance to fix her/his configuration
                    this.invalidConfigWarning(r);
                }
            } else {
                this._currentBoard.resetConfig();
                dc.configuration = undefined;
            }
        } else {
            this._currentBoard = null;
        }
        this._onBoardTypeChanged.fire();
        this.updateStatusBar();
    }

    /**
     * Event callback if DeviceContext detected a configuration change
     * - either when loaded from configuration file or when set by the
     * doChangeBoardType member.
     */
    private onDeviceContextConfigurationChange() {
        const dc = DeviceContext.getInstance();
        if (this._currentBoard) {
            const r = this._currentBoard.loadConfig(dc.configuration);
            if (r !== BoardConfigResult.Success && r !== BoardConfigResult.SuccessNoChange) {
                this._currentBoard.resetConfig();
                // We reset the configuration here but do not write it back
                // to the configuration file - this can be annoying when
                // someone tries to set a special configuration and doesn't
                // get it right the first time.
                this.invalidConfigWarning(r);
            }
        }
    }

    private invalidConfigWarning(result: BoardConfigResult) {
        let what = "";
        switch (result) {
            case BoardConfigResult.InvalidFormat:
                what = ": Invalid format must be of the form \"key1=value2,key1=value2,...\"";
                break;
            case BoardConfigResult.InvalidConfigID:
                what = ": Invalid configuration key";
                break;
            case BoardConfigResult.InvalidOptionID:
                what = ": Invalid configuration value";
                break;
        }
        vscode.window.showWarningMessage(`Invalid board configuration detected in configuration file${what}. Falling back to defaults.`);
    }

    private loadInstalledPlatforms() {
        const installed = this.getInstalledPlatforms();
        installed.forEach((platform) => {
            const existingPlatform = this._platforms.find((_plat) => {
                return _plat.package.name === platform.packageName && _plat.architecture === platform.architecture;
            });
            if (existingPlatform) {
                existingPlatform.defaultPlatform = platform.defaultPlatform;
                if (!existingPlatform.installedVersion) {
                    existingPlatform.installedVersion = platform.version;
                    existingPlatform.rootBoardPath = platform.rootBoardPath;
                    this._installedPlatforms.push(existingPlatform);
                }
            } else {
                platform.installedVersion = platform.version;
                this._installedPlatforms.push(platform);
            }
        });
    }

    // Default arduino package information from arduino installation directory.
    private getDefaultPlatforms(): IPlatform[] {
        const defaultPlatforms = [];
        try {
            const packageBundled = fs.readFileSync(path.join(this._settings.defaultPackagePath, "package_index_bundled.json"), "utf8");
            if (!packageBundled) {
                return defaultPlatforms;
            }
            const bundledObject = JSON.parse(packageBundled);
            if (bundledObject && bundledObject.packages) {
                for (const pkg of bundledObject.packages) {
                    for (const platform of pkg.platforms) {
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

    private getCustomPlatforms(): IPlatform[] {
        const customPlatforms = [];
        const hardwareFolder = path.join(this._settings.sketchbookPath, "hardware");
        if (!util.directoryExistsSync(hardwareFolder)) {
            return customPlatforms;
        }

        const dirs = util.filterJunk(util.readdirSync(hardwareFolder, true)); // in Mac, filter .DS_Store file.
        if (!dirs || dirs.length < 1) {
            return customPlatforms;
        }
        for (const packageName of dirs) {
            const architectures = util.filterJunk(util.readdirSync(path.join(hardwareFolder, packageName), true));
            if (!architectures || architectures.length < 1) {
                continue;
            }
            architectures.forEach((architecture) => {
                const platformFolder = path.join(hardwareFolder, packageName, architecture);
                if (util.fileExistsSync(path.join(platformFolder, "boards.txt")) && util.fileExistsSync(path.join(platformFolder, "platform.txt"))) {
                    const configs = util.parseConfigFile(path.join(platformFolder, "platform.txt"));
                    customPlatforms.push({
                        packageName,
                        architecture,
                        version: configs.get("version"),
                        rootBoardPath: path.join(hardwareFolder, packageName, architecture),
                        defaultPlatform: false,
                    });
                }
            });
        }
        return customPlatforms;
    }

    // User manually installed packages.
    private getManuallyInstalledPlatforms(): any[] {
        const manuallyInstalled = [];
        const rootPackagePath = path.join(path.join(this._settings.packagePath, "packages"));
        if (!util.directoryExistsSync(rootPackagePath)) {
            return manuallyInstalled;
        }
        const dirs = util.filterJunk(util.readdirSync(rootPackagePath, true)); // in Mac, filter .DS_Store file.
        for (const packageName of dirs) {
            const archPath = path.join(this._settings.packagePath, "packages", packageName, "hardware");
            if (!util.directoryExistsSync(archPath)) {
                continue;
            }
            const architectures = util.filterJunk(util.readdirSync(archPath, true));
            architectures.forEach((architecture) => {
                const allVersion = util.filterJunk(util.readdirSync(path.join(archPath, architecture), true));
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
            this.loadInstalledBoardsFromPlatform(plat);
        });
    }

    private loadInstalledBoardsFromPlatform(plat: IPlatform) {
        if (util.fileExistsSync(path.join(plat.rootBoardPath, "boards.txt"))) {
            const boardContent = fs.readFileSync(path.join(plat.rootBoardPath, "boards.txt"), "utf8");
            const res = parseBoardDescriptor(boardContent, plat);
            res.forEach((bd) => {
                this._boards.set(bd.key, bd);
            });
        }
    }

    private loadInstalledProgrammers(): void {
        this._programmers = new Map<string, IProgrammer>();
        this._installedPlatforms.forEach((plat) => {
            this.loadInstalledProgrammersFromPlatform(plat);
        });
    }

    private loadInstalledProgrammersFromPlatform(plat: IPlatform) {
        if (util.fileExistsSync(path.join(plat.rootBoardPath, "programmers.txt"))) {
            const programmersContent = fs.readFileSync(path.join(plat.rootBoardPath, "programmers.txt"), "utf8");
            const res = parseProgrammerDescriptor(programmersContent, plat);
            res.forEach((prog) => {
                this._programmers.set(prog.name, prog);
            });
        }
    }

    private listBoards(): IBoard[] {
        const result = [];
        this._boards.forEach((b) => {
            result.push(b);
        });
        return result;
    }

    private getIndexFileName(uriString: string): string {
        if (!uriString) {
            return;
        }
        const normalizedUrl = url.parse(uriString);
        if (!normalizedUrl) {
            return;
        }
        return normalizedUrl.pathname.substr(normalizedUrl.pathname.lastIndexOf("/") + 1);
    }

    private async setPreferenceUrls(additionalUrls: string[]) {
        const settingsUrls = additionalUrls.join(",");
        if (this._settings.preferences.get("boardsmanager.additional.urls") !== settingsUrls) {
            await this._arduinoApp.setPref("boardsmanager.additional.urls", settingsUrls);
        }
    }
}
