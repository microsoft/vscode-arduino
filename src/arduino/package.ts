/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

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
    tools: Array<object>;
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
     * The board descriptor information supported by this platform.
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
    package?: IPackage;

    /**
     * For custom package, only package name available.
     * @property {packageName}
     */
    packageName?: string;
}

export interface IBoardConfigOption {
    id: string;

    displayName: string;
}

export interface IBoardConfigItem {
    displayName: string;

    id: string;

    selectedOption: string;

    options: IBoardConfigOption[];
}

/**
 * Interface for classes that represent an Arduino supported board.
 *
 * @interface
 */
export interface IBoard {

    /**
     * Unique key that represent the board in the package:arch:alias.
     * @property {string}
     */
    key: string;

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
     * Reference to the platform that contains this board.
     * @prop {IPlatform}
     */
    platform: IPlatform;

    /**
     * Custom configuration for the Arduino board
     * @property {string}
     */
    customConfig: string;

    /**
     * Custom board's configuration items.
     * @property {IBoardConfigItem[]}
     */
    configItems: IBoardConfigItem[];

    /**
     * Board's parameter values.
     */
    addParameter(key: string, value: string): void;

    /**
     * Get board specified build configuration.
     */
    getBuildConfig(): string;

    /**
     * Load default configuration from saved context.
     */
    loadConfig(configString: string): void;

    /**
     * Update the configuration
     */
    updateConfig(configId: string, optionId: string): boolean;

    /**
     * Get the board package name
     */
    getPackageName();
}
