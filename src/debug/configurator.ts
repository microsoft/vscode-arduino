/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";

import { ArduinoApp } from "../arduino/arduino";
import { ArduinoSettings } from "../arduino/arduinoSettings";
import { BoardManager } from "../arduino/boardManager";
import * as platform from "../common/platform";
import * as util from "../common/util";
import { DeviceContext } from "../deviceContext";

const randomString = Uuid().replace(/\-/g, "").slice(0, 6);
/**
 * Automatically generate the Arduino board's debug settings.
 */
export class DebugConfigurator {
    constructor(
        private _extensionRoot: string,
        private _arduinoApp: ArduinoApp,
        private _arduinoSettings: ArduinoSettings,
        private _boardManager: BoardManager) {
    }

    public async run(config) {
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
            dc.output = path.join(`.temp_${randomString}`, this._boardManager.currentBoard.key.replace(/\:/g, "_"));
            util.mkdirRecursivelySync(path.join(vscode.workspace.rootPath, dc.output));
            config.program = path.join(vscode.workspace.rootPath, dc.output, `${path.basename(dc.sketch)}.elf`);

            // always compile elf to make sure debug the right elf
            if (!await this._arduinoApp.verify()) {
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
            config.miDebuggerPath = platform.findFile(this.getExecutableFileName("arm-none-eabi-gdb"),
                path.join(this._arduinoSettings.packagePath, "packages", this._boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            config.miDebuggerPath = platform.findFile(this.getExecutableFileName("arm-none-eabi-gdb"),
                path.join(this._arduinoSettings.packagePath, "packages"));
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
            config.debugServerPath = platform.findFile(this.getExecutableFileName("openocd"),
                path.join(this._arduinoSettings.packagePath, "packages",
                    this._boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            config.debugServerPath = platform.findFile(this.getExecutableFileName("openocd"),
                path.join(this._arduinoSettings.packagePath, "packages"));
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            vscode.window.showErrorMessage("Cannot find the OpenOCD from the launch.json debugServerPath property." +
                "Please input the right path of OpenOCD");
            return false;
        }
        this.resolveOpenOcdOptions(config);
        return true;
    }

    private resolveOpenOcdOptions(config) {
        if (config.debugServerPath && !config.debugServerArgs) {
            const fileContent = fs.readFileSync(path.join(this._extensionRoot, "misc", "openOCDMapping.json"), "utf8");
            const baordSettings = JSON.parse(fileContent);
            const boardOpenOcdConfig = baordSettings.find((board) => board.board === this._boardManager.currentBoard.key);
            if (boardOpenOcdConfig) {
                const debugServerPath = config.debugServerPath;
                let scriptsFolder = path.join(path.dirname(debugServerPath), "../scripts/");
                if (!util.directoryExistsSync(scriptsFolder)) {
                    scriptsFolder = path.join(path.dirname(debugServerPath), "../share/openocd/scripts/");
                }

                /* tslint:disable:max-line-length*/
                config.debugServerArgs = `-s ${scriptsFolder} -f ${boardOpenOcdConfig.interface} -f ${boardOpenOcdConfig.target}`;
            }
        }
    }

    private getExecutableFileName(fileName: string): string {
        if (platform.isWindows) {
            return `${fileName}.exe`;
        }
        return fileName;
    }
}
