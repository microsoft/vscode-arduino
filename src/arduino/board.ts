/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import { DeviceContext } from "../deviceContext";
import { IBoard, IBoardConfigItem, IPlatform } from "./package";

export function parseBoardDescriptor(boardDescriptor: string, plat: IPlatform): Map<string, IBoard> {
    const boardLineRegex = /([^\.]+)\.(\S+)=(.+)/;

    const result = new Map<string, IBoard>();
    const lines = boardDescriptor.split(/[\r|\r\n|\n]/);
    const menuMap = new Map<string, string>();

    lines.forEach((line) => {
        // Ignore comments.
        if (line.startsWith("#")) {
            return;
        }

        const match = boardLineRegex.exec(line);
        if (match && match.length > 3) {
            if (line.startsWith("menu.")) {
                menuMap.set(match[2], match[3]);
                return;
            }

            let boardObject = result.get(match[1]);
            if (!boardObject) {
                boardObject = new Board(match[1], plat, new Map<string, string>(), menuMap);
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

const MENU_REGEX = /menu\.([^\.]+)\.([^\.]+)(\.?(\S+)?)/;

export class Board implements IBoard {

    public board: string;

    public name?: string;

    public platform: IPlatform;

    private _configItems: IBoardConfigItem[];

    constructor(_board: string, _platform: IPlatform, _parameters: Map<string, string>, private _menuMap: Map<string, string>) {
        this.platform = _platform;
        this.board = _board;
        this._configItems = [];
    }

    public addParameter(key: string, value: string): void {
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

    public getBuildConfig(): string {
        const config = this.customConfig;
        const res = `${this.getPackageName()}:${this.platform.architecture}:${this.board}${config ? ":" + config : ""}`;
        return res;
    }

    /**
     * @returns {string} Return board key in format packageName:arch:boardName
     */
    public get key() {
        return `${this.getPackageName()}:${this.platform.architecture}:${this.board}`;
    }

    public get customConfig(): string {
        let res;
        if (this._configItems && this._configItems.length > 0) {
            res = this._configItems.map((configItem) => `${configItem.id}=${configItem.selectedOption}`).join(",");
        }
        return res;
    }

    public get configItems(): IBoardConfigItem[] {
        return this._configItems;
    }

    public loadConfig(configString: string): void {
        const configSections = configString.split(",");
        const keyValueRegex = /(\S+)=(\S+)/;
        configSections.forEach((configSection) => {
            const match = configSection.match(keyValueRegex);
            if (match && match.length >= 2) {
                this.updateConfig(match[1], match[2]);
            }
        });
    }

    public updateConfig(configId: string, optionId: string): boolean {
        const targetConfig = this._configItems.find((config) => config.id === configId);
        if (!targetConfig) {
            return false;
        }
        if (targetConfig.selectedOption !== optionId) {
            targetConfig.selectedOption = optionId;
            const dc = DeviceContext.getIntance();
            dc.configuration = this.customConfig;
            return true;
        }
        return false;
    }

    public getPackageName() {
        return this.platform.packageName ? this.platform.packageName : this.platform.package.name;
    }
}
