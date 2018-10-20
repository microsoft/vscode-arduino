// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";
import * as constants from "./common/constants";

import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import { IBoard } from "./arduino/package";
import ArduinoActivator from "./arduinoActivator";
import ArduinoContext from "./arduinoContext";
import {
    ARDUINO_CONFIG_FILE, ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_CONFIG_URI, BOARD_MANAGER_URI, EXAMPLES_URI,
    LIBRARY_MANAGER_URI,
} from "./common/constants";
import { validateArduinoPath } from "./common/platform";
import * as util from "./common/util";
import { ArduinoWorkspace } from "./common/workspace";
import { ArduinoDebugConfigurationProvider } from "./debug/configurationProvider";
import { DeviceContext } from "./deviceContext";
import { CompletionProvider } from "./langService/completionProvider";
import * as Logger from "./logger/logger";
import { NSAT } from "./nsat";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { UsbDetector } from "./serialmonitor/usbDetector";

const status: any = {};

export async function activate(context: vscode.ExtensionContext) {
    Logger.configure(context);
    const activeGuid = Uuid().replace(/-/g, "");
    Logger.traceUserData("start-activate-extension", { correlationId: activeGuid });
    // Show a warning message if the working file is not under the workspace folder.
    // People should know the extension might not work appropriately, they should look for the doc to get started.
    const openEditor = vscode.window.activeTextEditor;
    if (openEditor && openEditor.document.fileName.endsWith(".ino")) {
        const workingFile = path.normalize(openEditor.document.fileName);
        const workspaceFolder = (vscode.workspace && ArduinoWorkspace.rootPath) || "";
        if (!workspaceFolder || workingFile.indexOf(path.normalize(workspaceFolder)) < 0) {
            vscode.window.showWarningMessage(`The working file "${workingFile}" is not under the workspace folder, ` +
                "the arduino extension might not work appropriately.");
        }
    }

    const deviceContext = DeviceContext.getInstance();
    deviceContext.extensionPath = context.extensionPath;
    context.subscriptions.push(deviceContext);

    const arduinoManagerProvider = new ArduinoContentProvider(context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));

    const commandExecution = async (command: string, commandBody: (...args: any[]) => any, args: any, getUserData?: () => any) => {
        const guid = Uuid().replace(/\-/g, "");
        Logger.traceUserData(`start-command-` + command, { correlationId: guid });
        const timer1 = new Logger.Timer();
        let telemetryResult;
        try {
            let result = commandBody(...args);
            if (result) {
                result = await Promise.resolve(result);
            }
            if (result && result.telemetry) {
                telemetryResult = result;
            } else if (getUserData) {
                telemetryResult = getUserData();
            }
        } catch (error) {
            Logger.traceError("executeCommandError", error, { correlationId: guid, command });
        }

        Logger.traceUserData(`end-command-` + command, {
            ...telemetryResult,
            correlationId: guid,
            duration: timer1.end(),
        });

        NSAT.takeSurvey(context);
    };
    const registerArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!ArduinoContext.initialized) {
                await ArduinoActivator.activate();
            }

            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }

            const arduinoPath = ArduinoContext.arduinoApp.settings.arduinoPath;
            const commandPath = ArduinoContext.arduinoApp.settings.commandPath;
            if (!arduinoPath || !validateArduinoPath(arduinoPath)) { // Pop up vscode User Settings page when cannot resolve arduino path.
                Logger.notifyUserError("InvalidArduinoPath", new Error(constants.messages.INVALID_ARDUINO_PATH));
                vscode.commands.executeCommand("workbench.action.openGlobalSettings");
            } else if (!commandPath || !util.fileExistsSync(commandPath)) {
                Logger.notifyUserError("InvalidCommandPath", new Error(constants.messages.INVALID_COMMAND_PATH + commandPath));
            } else {
                await commandExecution(command, commandBody, args, getUserData);
            }
        }));
    };

    const registerNonArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            await commandExecution(command, commandBody, args, getUserData);
        }));
    };

    registerArduinoCommand("arduino.showBoardManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Board Manager");
    });

    registerArduinoCommand("arduino.showLibraryManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", LIBRARY_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Library Manager");
    });

    registerArduinoCommand("arduino.showBoardConfig", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_CONFIG_URI, vscode.ViewColumn.Two, "Arduino Board Configuration");
    });

    registerArduinoCommand("arduino.showExamples", (forceRefresh: boolean = false) => {
        vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
        if (forceRefresh) {
            vscode.commands.executeCommand("arduino.reloadExample");
        }
        return vscode.commands.executeCommand("vscode.previewHtml", EXAMPLES_URI, vscode.ViewColumn.Two, "Arduino Examples");
    });

    // change board type
    registerArduinoCommand("arduino.changeBoardType", async () => {
        try {
            await ArduinoContext.boardManager.changeBoardType();
        } catch (exception) {
            Logger.error(exception.message);
        }
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: ArduinoContext.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.reloadExample", () => {
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: (ArduinoContext.boardManager.currentBoard === null) ? null : ArduinoContext.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.initialize", async () => await deviceContext.initialize());

    registerArduinoCommand("arduino.verify", async () => {
        if (!status.compile) {
            status.compile = "verify";
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: "Arduino: Verifying...",
                }, async () => {
                    await ArduinoContext.arduinoApp.verify();
                });
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: (ArduinoContext.boardManager.currentBoard === null) ? null : ArduinoContext.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.upload", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: "Arduino: Uploading...",
                }, async () => {
                    await ArduinoContext.arduinoApp.upload();
                });
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: ArduinoContext.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.setSketchFile", async () => {
        const sketchFileName = deviceContext.sketch;
        const newSketchFileName = await vscode.window.showInputBox({
            placeHolder: sketchFileName,
            validateInput: (value) => {
                if (value && /\.((ino)|(cpp)|c)$/.test(value.trim())) {
                    return null;
                } else {
                    return "Invalid sketch file name. Should be *.ino/*.cpp/*.c";
                }
            },
        });

        if (!newSketchFileName) {
            return;
        }

        deviceContext.sketch = newSketchFileName;
        deviceContext.showStatusBar();
    });

    registerArduinoCommand("arduino.uploadUsingProgrammer", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await ArduinoContext.arduinoApp.uploadUsingProgrammer();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: ArduinoContext.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.selectProgrammer", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await ArduinoContext.arduinoApp.programmerManager.selectProgrammer();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: (ArduinoContext.boardManager.currentBoard === null) ? null : ArduinoContext.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.addLibPath", (path) => ArduinoContext.arduinoApp.addLibPath(path));
    registerArduinoCommand("arduino.openExample", (path) => ArduinoContext.arduinoApp.openExample(path));
    registerArduinoCommand("arduino.loadPackages", async () => await ArduinoContext.boardManager.loadPackages(true));
    registerArduinoCommand("arduino.installBoard", async (packageName, arch, version: string = "") => {
        let installed =  false;
        const installedBoards = ArduinoContext.boardManager.installedBoards;
        installedBoards.forEach((board: IBoard, key: string) => {
            let _packageName: string;
            if (board.platform.package && board.platform.package.name) {
                _packageName = board.platform.package.name;
            } else {
                _packageName = board.platform.packageName;
            }

            if (packageName === _packageName &&
                    arch === board.platform.architecture &&
                    (!version || version === board.platform.installedVersion)) {
                installed = true;
            }
        });

        if (!installed) {
            await ArduinoContext.boardManager.loadPackages(true);
            await ArduinoContext.arduinoApp.installBoard(packageName, arch, version);
        }
        return;
    });

    // serial monitor commands
    const serialMonitor = SerialMonitor.getInstance();
    context.subscriptions.push(serialMonitor);
    registerNonArduinoCommand("arduino.selectSerialPort", () => serialMonitor.selectSerialPort(null, null));
    registerNonArduinoCommand("arduino.openSerialMonitor", () => serialMonitor.openSerialMonitor());
    registerNonArduinoCommand("arduino.changeBaudRate", () => serialMonitor.changeBaudRate());
    registerNonArduinoCommand("arduino.changeEnding", () => serialMonitor.changeEnding());
    registerNonArduinoCommand("arduino.sendMessageToSerialPort", () => serialMonitor.sendMessageToSerialPort());
    registerNonArduinoCommand("arduino.closeSerialMonitor", (port) => serialMonitor.closeSerialMonitor(port));

    const completionProvider = new CompletionProvider();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("arduino", new ArduinoDebugConfigurationProvider()));

    UsbDetector.getInstance().initialize(context.extensionPath);
    UsbDetector.getInstance().startListening();

    if (ArduinoWorkspace.rootPath && (
        util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, ARDUINO_CONFIG_FILE))
        || (openEditor && openEditor.document.fileName.endsWith(".ino")))) {
        (async () => {
            if (!ArduinoContext.initialized) {
                await ArduinoActivator.activate();
            }

            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            ArduinoContext.boardManager.updateStatusBar(true);
            vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
        })();
    }
    vscode.window.onDidChangeActiveTextEditor(async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && ((path.basename(activeEditor.document.fileName) === "arduino.json"
            && path.basename(path.dirname(activeEditor.document.fileName)) === ".vscode")
            || activeEditor.document.fileName.endsWith(".ino")
        )) {
            if (!ArduinoContext.initialized) {
                await ArduinoActivator.activate();
            }
            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            ArduinoContext.boardManager.updateStatusBar(true);
            vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
        }
    });
    Logger.traceUserData("end-activate-extension", { correlationId: activeGuid });
}

export async function deactivate() {
    const monitor = SerialMonitor.getInstance();
    await monitor.closeSerialMonitor(null, false);
    UsbDetector.getInstance().stopListening();
    Logger.traceUserData("deactivate-extension");
}
