/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import os = require("os");
import fs = require("fs");
import path = require("path");
import vscode = require("vscode");
import settings = require("./settings");
import util = require("../common/util");

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
            return vscode.workspace.findFiles("**/c_cpp_properties.json", null, 1)
                .then((files) => {
                    if (!files || !files.length || files.length < 1) {
                        return;
                    }
                    const propertyFile = files[0];
                    const context = JSON.parse(fs.readFileSync(propertyFile.fsPath, "utf8"));
                    context.configurations.forEach((configSection) => {
                        if (configSection.name !== util.getCppConfigPlatform()) {
                            return;
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
                    });
                    fs.writeFileSync(propertyFile.fsPath, JSON.stringify(context, null, 4));
                });
        });
}

function loadProjectConfig(arduinoConfig: settings.IArduinoSettings): Thenable<Object> {
    return vscode.workspace.findFiles("device.json", null, 1)
        .then((files) => {
            const configFile = files[0];
            const projectConfig = JSON.parse(fs.readFileSync(configFile.fsPath, "utf8"));
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
    result.push(path.join(versionRoot, toolsPath, "cores"));
    result.push(path.join(versionRoot, toolsPath, "libraries"));

    return result;
}
