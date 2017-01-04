"use strict";

import os = require("os");
import fs = require("fs");
import path = require("path");
import vscode = require("vscode");
import settings = require("./settings");
import * as util from "../common/util";

export const outputChannel = vscode.window.createOutputChannel("Arduino");

export function upload(arduinoConfig: settings.IArduinoSettings) {
    return loadProjectConfig()
        .then((projectConfig: any) => {
            const boardDescriptor = getBoardDescriptor(projectConfig);
            const appPath = path.join(vscode.workspace.rootPath, projectConfig.appPath || "app.ino");
            outputChannel.show(true);
            return util.spawn(arduinoConfig.arduinoPath,
                outputChannel,
                ["--upload", "--board", boardDescriptor, "--port", projectConfig.port, appPath]);
        });
}

export function verify(arduinoConfig: settings.IArduinoSettings) {
    return loadProjectConfig()
        .then((projectConfig: any) => {
            const boardDescriptor = getBoardDescriptor(projectConfig);
            const appPath = path.join(vscode.workspace.rootPath, projectConfig.appPath || "app.ino");
            outputChannel.show(true);
            return util.spawn(arduinoConfig.arduinoPath,
                outputChannel,
                ["--verify", "--board", boardDescriptor, "--port", projectConfig.port, appPath]);
        });
}

function loadProjectConfig(): Thenable<Object> {
    return vscode.workspace.findFiles("device.json", null, 1)
        .then((files) => {
            const configFile = files[0];
            return JSON.parse(fs.readFileSync(configFile.fsPath, "utf8"));
        });
}

function getBoardDescriptor(projectConfig: any): string {
    let boardDescriptor = `${projectConfig.package}:${projectConfig.arch}:${projectConfig.board}`;
    if (projectConfig.parameters) {
        boardDescriptor = `${boardDescriptor}:${projectConfig.parameters}`;
    }
    return boardDescriptor;
}
