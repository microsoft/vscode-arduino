/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { ArduinoApp } from "../arduino/arduino";
import { ArduinoSettings } from "../arduino/arduinoSettings";
import { BoardManager } from "../arduino/boardManager";
import * as platform from "../common/platform";
import * as util from "../common/util";
import { DeviceContext } from "../deviceContext";
import { DebuggerManager } from "./debuggerManager";

/**
 * Automatically generate the Arduino board's debug settings.
 */
export class DebugConfigurator {
  private _debuggerManager: DebuggerManager;
    constructor(
        private _extensionRoot: string,
        ) {
      this._debuggerManager = new DebuggerManager(_extensionRoot);
    }

    public async run(config) {
        if (!this._debuggerManager.initialized) {
            this._debuggerManager.initialize();
        }
        // Default settings:
        if (!config.request) {
            config = {
                name: "Arduino",
                type: "arduino",
                request: "launch",
                program: "${file}",
                cwd: "${workspaceRoot}",
                MIMode: "gdb",
                logging: {
                    engineLogging: true,
                },
                targetArchitecture: "arm",
                customLaunchSetupCommands: [
                    {
                        text: "target remote localhost:3333",
                    },
                    {
                        text: "file ${file}",
                    },
                    {
                        text: "load",
                    },
                    {
                        text: "monitor reset halt",
                    },
                    {
                        text: "monitor reset init",
                    },
                ],
                stopAtEntry: true,
                serverStarted: "Info\\ :\\ [\\w\\d\\.]*:\\ hardware",
                launchCompleteCommand: "exec-continue",
                filterStderr: true,
                args: [],
            };
        }

        if (!this.resolveOpenOcd(config)) {
            return;
        }
        if (!await this.resolveOpenOcdOptions(config)) {
            return;
        }

        if (!this.resolveDebuggerPath(config)) {
            return;
        }

        if (!await this.resolveProgramPath(config)) {
            return;
        }

        // Use the C++ debugger MIEngine as the real internal debugger
        config.type = "cppdbg";
        vscode.commands.executeCommand("vscode.startDebug", config);
    }

    private async resolveProgramPath(config) {
        const dc = DeviceContext.getIntance();

        if (!config.program || config.program === "${file}") {
            // make a unique temp folder because keeping same temp folder will corrupt the build when board is changed
            const outputFolder = path.join(dc.output || `.build`, ArduinoApp.instance.boardManager.currentBoard.board);
            util.mkdirRecursivelySync(path.join(vscode.workspace.rootPath, outputFolder));
            config.program = path.join(vscode.workspace.rootPath, outputFolder, `${path.basename(dc.sketch)}.elf`);

            // always compile elf to make sure debug the right elf
            if (!await ArduinoApp.instance.verify(outputFolder)) {
                vscode.window.showErrorMessage("Failure to verify the program, please check output for details.");
                return false;
            }

            config.program = config.program.replace(/\\/g, "/");

            config.customLaunchSetupCommands.forEach((obj) => {
                if (obj.text && obj.text.indexOf("${file}") > 0) {
                    obj.text = obj.text.replace(/\$\{file\}/, config.program);
                }
            });
        }
        if (!util.fileExistsSync(config.program)) {
            vscode.window.showErrorMessage("Cannot find the elf file.");
            return false;
        }
        return true;
    }

    private resolveDebuggerPath(config) {
        if (!config.miDebuggerPath) {
            config.miDebuggerPath = platform.findFile(platform.getExecutableFileName("arm-none-eabi-gdb"),
                path.join(ArduinoApp.instance.settings.packagePath, "packages", ArduinoApp.instance.boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            config.miDebuggerPath = this._debuggerManager.miDebuggerPath;
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            vscode.window.showErrorMessage("Cannot find the debugger path.");
            return false;
        }
        return true;
    }

    private resolveOpenOcd(config) {
        const dc = DeviceContext.getIntance();
        if (!config.debugServerPath) {
            config.debugServerPath = platform.findFile(platform.getExecutableFileName("openocd"),
                path.join(ArduinoApp.instance.settings.packagePath, "packages",
                    ArduinoApp.instance.boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            config.debugServerPath = this._debuggerManager.debugServerPath;
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            vscode.window.showErrorMessage("Cannot find the OpenOCD from the launch.json debugServerPath property." +
                "Please input the right path of OpenOCD");
            return false;
        }

        return true;
    }

    private async resolveOpenOcdOptions(config) {

        if (config.debugServerPath && !config.debugServerArgs) {
            try {
                config.debugServerArgs = await this._debuggerManager.resolveOpenOcdOptions(config);
                if (!config.debugServerArgs) {
                    return false;
                }
            } catch (error) {
                vscode.window.showErrorMessage(error.message);
                return false;
            }
        }
        return true;
    }
}
