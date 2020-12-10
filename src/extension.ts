// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const impor = require("impor")(__dirname);

import * as fs from "fs";
import * as path from "path";
const uuidModule = impor("uuid/v4") as typeof import ("uuid/v4");
import * as vscode from "vscode";
import * as constants from "./common/constants";
const arduinoContentProviderModule =
    impor("./arduino/arduinoContentProvider") as typeof import ("./arduino/arduinoContentProvider");
import { IBoard } from "./arduino/package";
import { VscodeSettings } from "./arduino/vscodeSettings";
const arduinoActivatorModule = impor("./arduinoActivator") as typeof import ("./arduinoActivator");
const arduinoContextModule = impor("./arduinoContext") as typeof import ("./arduinoContext");
import {
    ARDUINO_CONFIG_FILE, ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_CONFIG_URI, BOARD_MANAGER_URI, EXAMPLES_URI,
    LIBRARY_MANAGER_URI,
} from "./common/constants";
import { validateArduinoPath } from "./common/platform";
import * as util from "./common/util";
import { ArduinoWorkspace } from "./common/workspace";
const arduinoDebugConfigurationProviderModule = impor("./debug/configurationProvider") as typeof import ("./debug/configurationProvider");
import { DeviceContext } from "./deviceContext";
const completionProviderModule = impor("./langService/completionProvider") as typeof import ("./langService/completionProvider");
import * as Logger from "./logger/logger";
const nsatModule =
    impor("./nsat") as typeof import ("./nsat");
import { BuildMode } from "./arduino/arduino";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
const usbDetectorModule = impor("./serialmonitor/usbDetector") as typeof import ("./serialmonitor/usbDetector");

const status: any = {};

export async function activate(context: vscode.ExtensionContext) {
    Logger.configure(context);
    const activeGuid = uuidModule().replace(/-/g, "");
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
    const vscodeSettings = VscodeSettings.getInstance();
    const deviceContext = DeviceContext.getInstance();
    deviceContext.extensionPath = context.extensionPath;
    context.subscriptions.push(deviceContext);

    const commandExecution = async (command: string, commandBody: (...args: any[]) => any, args: any, getUserData?: () => any) => {
        const guid = uuidModule().replace(/\-/g, "");
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

        nsatModule.NSAT.takeSurvey(context);
    };
    const registerArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!arduinoContextModule.default.initialized) {
                await arduinoActivatorModule.default.activate();
            }

            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }

            const arduinoPath = arduinoContextModule.default.arduinoApp.settings.arduinoPath;
            const commandPath = arduinoContextModule.default.arduinoApp.settings.commandPath;
            const useArduinoCli = arduinoContextModule.default.arduinoApp.settings.useArduinoCli;
            // Pop up vscode User Settings page when cannot resolve arduino path.
            if (!arduinoPath || !validateArduinoPath(arduinoPath, useArduinoCli)) {
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

    registerArduinoCommand("arduino.initialize", async () => await deviceContext.initialize());

    registerArduinoCommand("arduino.verify", async () => {
        if (!status.compile) {
            status.compile = "verify";
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: "Arduino: Verifying...",
                }, async () => {
                    await arduinoContextModule.default.arduinoApp.verify();
                });
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return {
            board: (arduinoContextModule.default.boardManager.currentBoard === null) ? null :
                arduinoContextModule.default.boardManager.currentBoard.name,
        };
    });

    registerArduinoCommand("arduino.upload", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: "Arduino: Uploading...",
                }, async () => {
                    await arduinoContextModule.default.arduinoApp.upload(BuildMode.Upload);
                });
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: arduinoContextModule.default.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.cliUpload", async () => {
        if (!status.compile) {
            status.compile = "cliUpload";
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Window,
                    title: "Arduino: Using CLI to upload...",
                }, async () => {
                    await arduinoContextModule.default.arduinoApp.upload(BuildMode.Upload, false);
                });
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: arduinoContextModule.default.boardManager.currentBoard.name };
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
                await arduinoContextModule.default.arduinoApp.upload(BuildMode.UploadProgrammer, true);
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: arduinoContextModule.default.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.cliUploadUsingProgrammer", async () => {
        if (!status.compile) {
            status.compile = "cliUpload";
            try {
                await arduinoContextModule.default.arduinoApp.upload(BuildMode.UploadProgrammer, false);
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: arduinoContextModule.default.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.selectProgrammer", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await arduinoContextModule.default.arduinoApp.programmerManager.selectProgrammer();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return {
            board: (arduinoContextModule.default.boardManager.currentBoard === null) ? null :
                arduinoContextModule.default.boardManager.currentBoard.name,
        };
    });

    registerArduinoCommand("arduino.addLibPath", (path) => arduinoContextModule.default.arduinoApp.addLibPath(path));
    registerArduinoCommand("arduino.openExample", (path) => arduinoContextModule.default.arduinoApp.openExample(path));
    registerArduinoCommand("arduino.loadPackages", async () => await arduinoContextModule.default.boardManager.loadPackages(true));
    registerArduinoCommand("arduino.installBoard", async (packageName, arch, version: string = "") => {
        let installed = false;
        const installedBoards = arduinoContextModule.default.boardManager.installedBoards;
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
            await arduinoContextModule.default.boardManager.loadPackages(true);
            await arduinoContextModule.default.arduinoApp.installBoard(packageName, arch, version);
        }
        return;
    });

    // serial monitor commands
    const serialMonitor = SerialMonitor.getInstance();
    context.subscriptions.push(serialMonitor);
    registerNonArduinoCommand("arduino.selectSerialPort", () => serialMonitor.selectSerialPort(null, null));
    registerNonArduinoCommand("arduino.openSerialMonitor", () => serialMonitor.openSerialMonitor());
    registerNonArduinoCommand("arduino.changeBaudRate", () => serialMonitor.changeBaudRate());
    registerNonArduinoCommand("arduino.sendMessageToSerialPort", () => serialMonitor.sendMessageToSerialPort());
    registerNonArduinoCommand("arduino.closeSerialMonitor", (port, showWarning = true) => serialMonitor.closeSerialMonitor(port, showWarning));

    const completionProvider = new completionProviderModule.CompletionProvider();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("arduino", new
        arduinoDebugConfigurationProviderModule.ArduinoDebugConfigurationProvider()));

    if (ArduinoWorkspace.rootPath && (
        util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, ARDUINO_CONFIG_FILE))
        || (openEditor && openEditor.document.fileName.endsWith(".ino")))) {
        (async () => {
            if (!arduinoContextModule.default.initialized) {
                await arduinoActivatorModule.default.activate();
            }

            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            arduinoContextModule.default.boardManager.updateStatusBar(true);
            arduinoContextModule.default.arduinoApp.tryToUpdateIncludePaths();
            vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
        })();
    }
    vscode.window.onDidChangeActiveTextEditor(async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && ((path.basename(activeEditor.document.fileName) === "arduino.json"
            && path.basename(path.dirname(activeEditor.document.fileName)) === ".vscode")
            || activeEditor.document.fileName.endsWith(".ino")
        )) {
            if (!arduinoContextModule.default.initialized) {
                await arduinoActivatorModule.default.activate();
            }
            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            arduinoContextModule.default.boardManager.updateStatusBar(true);
            vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
        }
    });

    const allowPDEFiletype = vscodeSettings.allowPDEFiletype;

    if (allowPDEFiletype) {
        vscode.workspace.onDidOpenTextDocument(async (document) => {
            if (/\.pde$/.test(document.uri.fsPath)) {
                const newFsName = document.uri.fsPath.replace(/\.pde$/, ".ino");
                await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                fs.renameSync(document.uri.fsPath, newFsName);
                await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(newFsName));
            }
        });

        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (!editor) {
                return;
            }
            const document = editor.document;
            if (/\.pde$/.test(document.uri.fsPath)) {
                const newFsName = document.uri.fsPath.replace(/\.pde$/, ".ino");
                await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                fs.renameSync(document.uri.fsPath, newFsName);
                await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(newFsName));
            }
        });
    }
    Logger.traceUserData("end-activate-extension", { correlationId: activeGuid });

    setTimeout(() => {
        const arduinoManagerProvider = new arduinoContentProviderModule.ArduinoContentProvider(context.extensionPath);
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));
        registerArduinoCommand("arduino.showBoardManager", async () => {
            const panel = vscode.window.createWebviewPanel("arduinoBoardManager", "Arduino Board Manager", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = await arduinoManagerProvider.provideTextDocumentContent(BOARD_MANAGER_URI);
        });
        registerArduinoCommand("arduino.showLibraryManager", async () => {
            const panel = vscode.window.createWebviewPanel("arduinoLibraryManager", "Arduino Library Manager", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = await arduinoManagerProvider.provideTextDocumentContent(LIBRARY_MANAGER_URI);
        });
        registerArduinoCommand("arduino.showBoardConfig", async () => {
            const panel = vscode.window.createWebviewPanel("arduinoBoardConfiguration", "Arduino Board Configuration", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = await arduinoManagerProvider.provideTextDocumentContent(BOARD_CONFIG_URI);
        });
        registerArduinoCommand("arduino.showExamples", async (forceRefresh: boolean = false) => {
            vscode.commands.executeCommand("setContext", "vscode-arduino:showExampleExplorer", true);
            if (forceRefresh) {
                vscode.commands.executeCommand("arduino.reloadExample");
            }
            const panel = vscode.window.createWebviewPanel("arduinoExamples", "Arduino Examples", vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            panel.webview.html = await arduinoManagerProvider.provideTextDocumentContent(EXAMPLES_URI);
        });
        // change board type
        registerArduinoCommand("arduino.changeBoardType", async () => {
            try {
                await arduinoContextModule.default.boardManager.changeBoardType();
            } catch (exception) {
                Logger.error(exception.message);
            }
            arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
            arduinoManagerProvider.update(EXAMPLES_URI);
        }, () => {
            return { board: arduinoContextModule.default.boardManager.currentBoard.name };
        });
        registerArduinoCommand("arduino.reloadExample", () => {
            arduinoManagerProvider.update(EXAMPLES_URI);
        }, () => {
            return {
                board: (arduinoContextModule.default.boardManager.currentBoard === null) ? null :
                    arduinoContextModule.default.boardManager.currentBoard.name,
            };
        });
    }, 100);

    setTimeout(() => {
        // delay to detect usb
        usbDetectorModule.UsbDetector.getInstance().initialize(context.extensionPath);
        usbDetectorModule.UsbDetector.getInstance().startListening();
    }, 200);
}

export async function deactivate() {
    const monitor = SerialMonitor.getInstance();
    await monitor.closeSerialMonitor(null, false);
    usbDetectorModule.UsbDetector.getInstance().stopListening();
    Logger.traceUserData("deactivate-extension");
}
