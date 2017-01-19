/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

import * as constants from "../common/constants";
import * as util from "../common/util";
import * as settings from "./settings";

export const outputChannel = vscode.window.createOutputChannel("Arduino");

export function upload(arduinoSettings: settings.IArduinoSettings) {
    return loadProjectConfig(arduinoSettings)
        .then((projectConfig: any) => {
            const boardDescriptor = getBoardDescriptor(projectConfig);
            const appPath = path.join(vscode.workspace.rootPath, projectConfig.appPath || "app/app.ino");
            outputChannel.show(true);
            return util.spawn(arduinoSettings.commandPath,
                outputChannel,
                ["--upload", "--board", boardDescriptor, "--port", projectConfig.port, appPath]);
        });
}

export function verify(arduinoConfig: settings.IArduinoSettings) {
    return loadProjectConfig(arduinoConfig)
        .then((projectConfig: any) => {
            const boardDescriptor = getBoardDescriptor(projectConfig);
            const appPath = path.join(vscode.workspace.rootPath, projectConfig.appPath || "app/app.ino");
            outputChannel.show(true);
            return util.spawn(arduinoConfig.commandPath,
                outputChannel,
                ["--verify", "--board", boardDescriptor, "--port", projectConfig.port, appPath]);
        });
}

export function addLibPath(arduinoConfig: settings.IArduinoSettings) {
    return loadProjectConfig(arduinoConfig)
        .then((projectConfig: any) => {
            const paths = getPackageLibPaths(arduinoConfig.packagePath, projectConfig);
            paths.push(arduinoConfig.libPath);
            return vscode.workspace.findFiles(constants.DEVICE_CONFIG_FILE, null, 1)
                .then((files) => {
                    let deviceContext = null;
                    if (!files || !files.length || files.length < 1) {
                        deviceContext = {};
                    } else {
                        const propertyFile = files[0];
                        deviceContext = JSON.parse(fs.readFileSync(propertyFile.fsPath, "utf8"));
                    }
                    deviceContext.configurations = deviceContext.configurations || [];
                    let configSection = null;
                    deviceContext.configurations.forEach((section) => {
                        if (section.name === util.getCppConfigPlatform()) {
                            configSection = section;
                        }
                    });

                    if (!configSection) {
                        configSection = {
                            name: util.getCppConfigPlatform(),
                            includePath: [],
                        };
                        deviceContext.configurations.push(configSection);
                    }

                    paths.forEach((libPath) => {
                        libPath = path.resolve(path.normalize(libPath));
                        if (configSection.includePath && configSection.includePath.length) {
                            for (let existingPath of configSection.includePath) {
                                if (libPath === path.resolve(path.normalize(existingPath))) {
                                    return;
                                }
                            }
                        } else {
                            configSection.includePath = [];
                        }
                        configSection.includePath.push(libPath);
                    });

                    fs.writeFileSync(path.join(vscode.workspace.rootPath, constants.DEVICE_CONFIG_FILE), JSON.stringify(deviceContext, null, 4));
                });
        });
}

function loadProjectConfig(arduinoConfig: settings.IArduinoSettings): Thenable<Object> {
    return vscode.workspace.findFiles(constants.DEVICE_CONFIG_FILE, null, 1)
        .then((files) => {
            let projectConfig: any = {};
            if (files && files.length > 0) {
                const configFile = files[0];
                projectConfig = JSON.parse(fs.readFileSync(configFile.fsPath, "utf8"));
            }

            const arduinoPreferenes = loadPreferences(arduinoConfig.packagePath);
            projectConfig.board = projectConfig.board || arduinoPreferenes.get("board");
            projectConfig.package = projectConfig.package || arduinoPreferenes.get("target_package");
            projectConfig.arch = projectConfig.arch || arduinoPreferenes.get("target_platform");

            return projectConfig;
        });
}

function getBoardDescriptor(projectConfig: any): string {
    let boardDescriptor = `${projectConfig.package}:${projectConfig.arch}:${projectConfig.board}`;
    if (projectConfig.parameters) {
        boardDescriptor = `${boardDescriptor}:${projectConfig.parameters}`;
    }
    return boardDescriptor;
}

function loadPreferences(packagePath: string) {
    const preferences = new Map<string, string>();
    const lineRegex = /(\S+)=(\S+)/;

    const rawText = fs.readFileSync(path.join(packagePath, "preferences.txt"), "utf8");
    const lines = rawText.split("\n");
    lines.forEach((line) => {
        if (line) {
            let match = lineRegex.exec(line);
            if (match && match.length > 2) {
                preferences.set(match[1], match[2]);
            }
        }
    });

    return preferences;
}

function getPackageLibPaths(packageRootPath: string, boardConfig: any): string[] {
    const result = [];
    const versionRoot = path.join(packageRootPath, "packages", boardConfig.package, "hardware", boardConfig.arch);
    if (!fs.existsSync(versionRoot)) {
        return result;
    }
    const allVersionsPath = fs.readdirSync(versionRoot);
    const toolsPath = allVersionsPath[0];
    const coreLibs = fs.readdirSync(path.join(versionRoot, toolsPath, "cores"));
    if (coreLibs && coreLibs.length > 0) {
        coreLibs.forEach((coreLib) => {
            result.push(path.join(versionRoot, toolsPath, "cores", coreLib));
        });
    }

    return result;
}
