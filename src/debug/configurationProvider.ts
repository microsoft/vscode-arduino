// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as vscode from "vscode";

import { ArduinoApp, BuildMode } from "../arduino/arduino";
import ArduinoActivator from "../arduinoActivator";
import ArduinoContext from "../arduinoContext";

import { VscodeSettings } from "../arduino/vscodeSettings";
import * as constants from "../common/constants";
import * as platform from "../common/platform";
import * as util from "../common/util";
import { ArduinoWorkspace } from "../common/workspace";
import { DeviceContext } from "../deviceContext";
import * as Logger from "../logger/logger";

export class ArduinoDebugConfigurationProvider implements vscode.DebugConfigurationProvider {

    constructor() { }

    public provideDebugConfigurations(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken):
        vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return [
            this.getDefaultDebugSettings(folder),
        ];
    }

    // Try to add all missing attributes to the debug configuration being launched.
    public resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken):
        vscode.ProviderResult<vscode.DebugConfiguration> {
        if (!config || !config.request) {
            config = this.getDefaultDebugSettings(folder);
        }
        return this.resolveDebugConfigurationAsync(config);
    }

    private getDefaultDebugSettings(folder: vscode.WorkspaceFolder | undefined) {
        return {
            name: "Arduino",
            type: "arduino",
            request: "launch",
            program: "${file}",
            cwd: "${workspaceFolder}",
            MIMode: "gdb",
            targetArchitecture: "arm",
            miDebuggerPath: "",
            debugServerPath: "",
            debugServerArgs: "",
            customLaunchSetupCommands: [
                {
                    text: "target remote localhost:3333",
                },
                {
                    text: "file \"${file}\"",
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

    private async resolveDebugConfigurationAsync(config: vscode.DebugConfiguration) {
        if (!ArduinoContext.initialized) {
            await ArduinoActivator.activate();
        }

        if (VscodeSettings.getInstance().logLevel === constants.LogLevel.Verbose && !config.logging) {
            config = {
                ...config, logging: {
                    engineLogging: true,
                },
            };
        }

        if (!ArduinoContext.boardManager.currentBoard) {
            vscode.window.showErrorMessage("Please select a board.");
            return undefined;
        }

        if (!this.resolveOpenOcd(config)) {
            return undefined;
        }

        if (!await this.resolveOpenOcdOptions(config)) {
            return undefined;
        }

        if (!this.resolveDebuggerPath(config)) {
            return undefined;
        }

        if (!await this.resolveProgramPath(config)) {
            return undefined;
        }

        // Use the C++ debugger MIEngine as the real internal debugger
        config.type = "cppdbg";
        const dc = DeviceContext.getInstance();
        Logger.traceUserData("start-cppdbg", { board: dc.board });
        return config;
    }

    private async resolveProgramPath(config) {
        const dc = DeviceContext.getInstance();

        if (!config.program || config.program === "${file}") {
            // make a unique temp folder because keeping same temp folder will corrupt the build when board is changed
            const outputFolder = path.join(dc.output || `.build`, ArduinoContext.boardManager.currentBoard.board);
            util.mkdirRecursivelySync(path.join(ArduinoWorkspace.rootPath, outputFolder));
            if (!dc.sketch || !util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, dc.sketch))) {
                await dc.resolveMainSketch();
            }

            if (!dc.sketch) {
                vscode.window.showErrorMessage("No sketch file was found. Please specify the sketch in the arduino.json file");
                return false;
            }

            if (!util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, dc.sketch))) {
                vscode.window.showErrorMessage(`Cannot find ${dc.sketch}, Please specify the sketch in the arduino.json file`);
                return false;
            }
            config.program = path.join(ArduinoWorkspace.rootPath, outputFolder, `${path.basename(dc.sketch)}.elf`);

            // always compile elf to make sure debug the right elf
            if (!await ArduinoContext.arduinoApp.build(BuildMode.Verify, true, outputFolder)) {
                vscode.window.showErrorMessage("Failed to verify the program, please check the output for details.");
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
                path.join(ArduinoContext.arduinoApp.settings.packagePath, "packages", ArduinoContext.boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            config.miDebuggerPath = ArduinoContext.debuggerManager.miDebuggerPath;
        }
        if (!util.fileExistsSync(config.miDebuggerPath)) {
            vscode.window.showErrorMessage("Cannot find the debugger path.");
            return false;
        }
        return true;
    }

    private resolveOpenOcd(config) {
        if (!config.debugServerPath) {
            config.debugServerPath = platform.findFile(platform.getExecutableFileName("openocd"),
                path.join(ArduinoContext.arduinoApp.settings.packagePath, "packages",
                    ArduinoContext.boardManager.currentBoard.getPackageName()));
        }
        if (!util.fileExistsSync(config.debugServerPath)) {
            config.debugServerPath = ArduinoContext.debuggerManager.debugServerPath;
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
                config.debugServerArgs = await ArduinoContext.debuggerManager.resolveOpenOcdOptions(config);
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
