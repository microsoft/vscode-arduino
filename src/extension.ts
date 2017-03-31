/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";

import { ArduinoApp } from "./arduino/arduino";
import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import { BoardManager } from "./arduino/boardManager";
import { ExampleManager } from "./arduino/exampleManager";
import { LibraryManager } from "./arduino/libraryManager";
import { ArduinoSettings } from "./arduino/settings";
import { ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_CONFIG_URI, BOARD_MANAGER_URI, EXAMPLES_URI, LIBRARY_MANAGER_URI } from "./common/constants";
import { DeviceContext } from "./deviceContext";
import { CompletionProvider } from "./langService/completionProvider";
import * as Logger from "./logger/logger";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { UsbDetector } from "./serialmonitor/usbDetector";

export async function activate(context: vscode.ExtensionContext) {
    Logger.configure(context);
    let activeGuid = Uuid().replace(/\-/g, "");
    Logger.traceUserData("start-activate-extension", { correlationId: activeGuid });
    const arduinoSettings = new ArduinoSettings();
    await arduinoSettings.initialize();
    const arduinoApp = new ArduinoApp(arduinoSettings);
    await arduinoApp.initialize();

    // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
    let deviceContext = DeviceContext.getIntance();
    deviceContext.arduinoApp = arduinoApp;
    await deviceContext.loadContext();
    context.subscriptions.push(deviceContext);

    // Arduino board manager & library manager
    const boardManager = new BoardManager(arduinoSettings, arduinoApp);
    arduinoApp.boardManager = boardManager;
    await boardManager.loadPackages();
    const libraryManager = new LibraryManager(arduinoSettings, arduinoApp);
    arduinoApp.libraryManager = libraryManager;

    const exampleManager = new ExampleManager(arduinoSettings, arduinoApp);
    arduinoApp.exampleManager = exampleManager;

    const arduinoManagerProvider = new ArduinoContentProvider(arduinoSettings, arduinoApp, context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));

    let registerCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): vscode.Disposable => {
        return vscode.commands.registerCommand(command, async (...args: any[]) => {
            let guid = Uuid().replace(/\-/g, "");
            Logger.traceUserData(`start-command-` + command, { correlationId: guid });
            let timer1 = new Logger.Timer();
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
        await boardManager.changeBoardType();
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: boardManager.currentBoard.name };
    }));

    context.subscriptions.push(registerCommand("arduino.initialize", async () => await deviceContext.initialize()));

    context.subscriptions.push(registerCommand("arduino.verify", () => arduinoApp.verify(), () => {
        return { board: boardManager.currentBoard.name };
    }));

    context.subscriptions.push(registerCommand("arduino.upload", () => arduinoApp.upload(),
        () => {
            return { board: boardManager.currentBoard.name };
        }));

    context.subscriptions.push(registerCommand("arduino.addLibPath", (path) => arduinoApp.addLibPath(path)));

    // serial monitor commands
    const monitor = new SerialMonitor();
    context.subscriptions.push(monitor);
    context.subscriptions.push(registerCommand("arduino.selectSerialPort", () => monitor.selectSerialPort()));
    context.subscriptions.push(registerCommand("arduino.openSerialMonitor", () => monitor.openSerialMonitor()));
    context.subscriptions.push(registerCommand("arduino.changeBaudRate", () => monitor.changeBaudRate()));
    context.subscriptions.push(registerCommand("arduino.sendMessageToSerialPort", () => monitor.sendMessageToSerialPort()));
    context.subscriptions.push(registerCommand("arduino.closeSerialMonitor", (port) => monitor.closeSerialMonitor(port)));

    const completionProvider = new CompletionProvider(arduinoApp);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));

    const usbDetector = new UsbDetector(arduinoApp, boardManager, context.extensionPath);
    usbDetector.startListening();

    Logger.traceUserData("end-activate-extension", { correlationId: activeGuid });
}

export function deactivate() {
    Logger.traceUserData("deactivate-extension");
}
