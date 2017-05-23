/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/
import * as path from "path";
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";

import { ArduinoApp } from "./arduino/arduino";
import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import { ArduinoSettings } from "./arduino/arduinoSettings";
import { BoardManager } from "./arduino/boardManager";
import { ExampleManager } from "./arduino/exampleManager";
import { LibraryManager } from "./arduino/libraryManager";
import { ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_CONFIG_URI, BOARD_MANAGER_URI, EXAMPLES_URI, LIBRARY_MANAGER_URI } from "./common/constants";
import { DebugConfigurator } from "./debug/configurator";
import { DeviceContext } from "./deviceContext";
import { CompletionProvider } from "./langService/completionProvider";
import * as Logger from "./logger/logger";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { UsbDetector } from "./serialmonitor/usbDetector";

let usbDetector: UsbDetector = null;

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
        const workspaceFolder = (vscode.workspace && vscode.workspace.rootPath) || "";
        if (!workspaceFolder || workingFile.indexOf(path.normalize(workspaceFolder)) < 0) {
            vscode.window.showWarningMessage(`The working file "${workingFile}" is not under the workspace folder, ` +
                "the arduino extension might not work appropriately.");
        }
    }

    const arduinoSettings = new ArduinoSettings();
    await arduinoSettings.initialize();
    const arduinoApp = new ArduinoApp(arduinoSettings);
    await arduinoApp.initialize();

    // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
    const deviceContext = DeviceContext.getIntance();
    deviceContext.extensionPath = context.extensionPath;
    await deviceContext.loadContext();
    context.subscriptions.push(deviceContext);

    // Arduino board manager & library manager
    const boardManager = new BoardManager(arduinoSettings, arduinoApp);
    arduinoApp.boardManager = boardManager;
    await boardManager.loadPackages();
    arduinoApp.libraryManager = new LibraryManager(arduinoSettings, arduinoApp);
    arduinoApp.exampleManager = new ExampleManager(arduinoSettings, arduinoApp);

    const arduinoManagerProvider = new ArduinoContentProvider(arduinoApp, context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));

    const registerCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): vscode.Disposable => {
        return vscode.commands.registerCommand(command, async (...args: any[]) => {
            const guid = Uuid().replace(/-/g, "");
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

            Logger.traceUserData(`end-command-` + command, { ...telemetryResult, correlationId: guid, duration: timer1.end() });
        });
    };

    context.subscriptions.push(registerCommand("arduino.showBoardManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Boards Manager");
    }));

    context.subscriptions.push(registerCommand("arduino.showLibraryManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", LIBRARY_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Libraries Manager");
    }));

    context.subscriptions.push(registerCommand("arduino.showBoardConfig", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_CONFIG_URI, vscode.ViewColumn.Two, "Arduino Board Configuration");
    }));

    context.subscriptions.push(registerCommand("arduino.showExamples", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", EXAMPLES_URI, vscode.ViewColumn.Two, "Arduino Examples");
    }));

    // change board type
    context.subscriptions.push(registerCommand("arduino.changeBoardType", async () => {
        try {
            await boardManager.changeBoardType();
        } catch (exception) {
            Logger.error(exception.message);
        }
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: boardManager.currentBoard.name };
    }));

    context.subscriptions.push(registerCommand("arduino.reloadExample", () => {
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: boardManager.currentBoard.name };
    }));

    context.subscriptions.push(registerCommand("arduino.initialize", async () => await deviceContext.initialize()));

    context.subscriptions.push(registerCommand("arduino.verify", async () => {
        if (!status.compile) {
            status.compile = "verify";
            try {
                await arduinoApp.verify();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: boardManager.currentBoard.name };
    }));

    context.subscriptions.push(registerCommand("arduino.upload", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await arduinoApp.upload();
            } catch (ex) {
            }
            delete status.compile;
        }
    },
        () => {
            return { board: boardManager.currentBoard.name };
        }));

    context.subscriptions.push(registerCommand("arduino.addLibPath", (path) => arduinoApp.addLibPath(path)));

    const arduinoConfigurator = new DebugConfigurator(context.extensionPath, arduinoApp, arduinoSettings, boardManager);
    //  Arduino debugger
    context.subscriptions.push(registerCommand("arduino.debug.startSession", async (config) => {
        if (!status.debug) {
            status.debug = "debug";
            try {
                await arduinoConfigurator.run(config);
            } catch (ex) {
            }
            delete status.debug;

        }
    }));

    // serial monitor commands
    const serialMonitor = SerialMonitor.getIntance();
    context.subscriptions.push(serialMonitor);
    context.subscriptions.push(registerCommand("arduino.selectSerialPort", () => serialMonitor.selectSerialPort(null, null)));
    context.subscriptions.push(registerCommand("arduino.openSerialMonitor", () => serialMonitor.openSerialMonitor()));
    context.subscriptions.push(registerCommand("arduino.changeBaudRate", () => serialMonitor.changeBaudRate()));
    context.subscriptions.push(registerCommand("arduino.sendMessageToSerialPort", () => serialMonitor.sendMessageToSerialPort()));
    context.subscriptions.push(registerCommand("arduino.closeSerialMonitor", (port) => serialMonitor.closeSerialMonitor(port)));

    const completionProvider = new CompletionProvider(arduinoApp);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));

    usbDetector = new UsbDetector(arduinoApp, boardManager, context.extensionPath);
    usbDetector.startListening();

    const updateStatusBar = () => {
        boardManager.updateStatusBar(true);
    };

    updateStatusBar();

    Logger.traceUserData("end-activate-extension", { correlationId: activeGuid });
}

export async function deactivate() {
    const monitor = SerialMonitor.getIntance();
    await monitor.closeSerialMonitor(null, false);
    if (usbDetector) {
        usbDetector.stopListening();
    }
    Logger.traceUserData("deactivate-extension");
}
