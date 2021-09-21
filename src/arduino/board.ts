// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { BoardConfigResult, IBoard, IBoardConfigItem, IPlatform } from "./package";

export function parseBoardDescriptor(boardDescriptor: string, plat: IPlatform): Map<string, IBoard> {
    const boardLineRegex = /([^.]+)\.(\S+)=(.+)/;

    const result = new Map<string, IBoard>();
    const lines = boardDescriptor.split(/(?:\r|\r\n|\n)/);
    const menuMap = new Map<string, string>();

    lines.forEach((line) => {
        // Ignore comments.
        if (line.startsWith("#")) {
            return;
        }

        const match = boardLineRegex.exec(line);
        if (match) {
            if (line.startsWith("menu.")) {
                menuMap.set(match[2], match[3]);
                return;
            }

            let boardObject = result.get(match[1]);
            if (!boardObject) {
                boardObject = new Board(match[1], plat, menuMap);
                result.set(boardObject.board, boardObject);
            }
            if (match[2] === "name") {
                boardObject.name = match[3].trim();
            } else {
                boardObject.addParameter(match[2], match[3]);
            }
        }
    });
    return result;
}

const MENU_REGEX = /menu\.([^.]+)\.([^.]+)(\.?(\S+)?)/;

export class Board implements IBoard {
    public name?: string;

    private _configItems: IBoardConfigItem[];

    constructor(private _board: string,
                private _platform: IPlatform,
                private _menuMap: Map<string, string>) {
        this._configItems = [];
    }

    public get board() {
        return this._board;
    }

    public get platform() {
        return this._platform;
    }

    public addParameter(key: string, value: string) {
        const match = key.match(MENU_REGEX);
        if (match) {
            const existingItem = this._configItems.find((item) => item.id === match[1]);
            if (existingItem) {
                if (!existingItem.selectedOption) {
                    existingItem.selectedOption = match[2];
                }
                const existingOption = existingItem.options.find((opt) => opt.id === match[2]);
                if (!existingOption) {
                    existingItem.options.push({ id: match[2], displayName: value });
                }
            } else {
                this._configItems.push({
                    displayName: this._menuMap.get(match[1]),
                    id: match[1],
                    selectedOption: match[2],
                    options: [{ id: match[2], displayName: value }],
                });
            }
        }
    }
    public getBuildConfig() {
        return `${this.getPackageName()}:${this.platform.architecture}:${this.board}${this.customConfig ? ":" + this.customConfig : ""}`;
    }

    /**
     * @returns {string} Return board key in format packageName:arch:boardName
     */
    public get key() {
        return `${this.getPackageName()}:${this.platform.architecture}:${this.board}`;
    }

    public get customConfig(): string {
        if (this._configItems && this._configItems.length > 0) {
            return this._configItems.map((configItem) => `${configItem.id}=${configItem.selectedOption}`).join(",");
        }
    }

    public get configItems() {
        return this._configItems;
    }

    public loadConfig(configString: string) {
        // An empty or undefined config string resets the configuration
        if (!configString) {
            this.resetConfig();
            return BoardConfigResult.Success;
        }
        const configSections = configString.split(",");
        const keyValueRegex = /(\S+)=(\S+)/;
        let result = BoardConfigResult.Success;
        for (const section of configSections) {
            const match = section.match(keyValueRegex);
            if (!match) {
                return BoardConfigResult.InvalidFormat;
            }
            const r = this.updateConfig(match[1], match[2]);
            switch (r) {
                case BoardConfigResult.SuccessNoChange:
                    result = r;
                    break;
                case BoardConfigResult.Success:
                    break;
                default:
                    return r;
            }
        }
        return result;
    }

    /**
     * For documentation see the documentation on IBoard.updateConfig().
     */
    public updateConfig(configId: string, optionId: string) {
        const targetConfig = this._configItems.find((config) => config.id === configId);
        if (!targetConfig) {
            return BoardConfigResult.InvalidConfigID;
        }
        // Iterate through all options and ...
        for (const o of targetConfig.options) {
            // Make sure that we only set valid options, e.g. when loading
            // from config files.
            if (o.id === optionId) {
                if (targetConfig.selectedOption !== optionId) {
                    targetConfig.selectedOption = optionId;
                    return BoardConfigResult.Success;
                }
                return BoardConfigResult.SuccessNoChange;
            }
        }
        return BoardConfigResult.InvalidOptionID;
    }

    public resetConfig() {
        for (const c of this._configItems) {
            c.selectedOption = c.options[0].id;
        }
    }

    public getPackageName() {
        return this.platform.packageName ? this.platform.packageName : this.platform.package.name;
    }
}

/**
 * Test if two boards are of the same type, i.e. have the same key.
 * @param {IBoard | undefined} a A board.
 * @param {IBoard | undefined} b And another board.
 * @returns {boolean} true if two boards are of the same type, else false.
 */
export function boardEqual(a: IBoard | undefined,
                           b: IBoard | undefined) {
    if (a && b) {
        return a.key === b.key;
    } else if (a || b) {
        return false;
    }
    return true;
}
