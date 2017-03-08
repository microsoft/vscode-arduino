/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

import { ArduinoApp } from "./arduino/arduino";
import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import { BoardManager } from "./arduino/boardManager";
import { LibraryManager } from "./arduino/libraryManager";
import { ArduinoSettings } from "./arduino/settings";
import { ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_MANAGER_URI, LIBRARY_MANAGER_URI } from "./common/constants";
import { DeviceContext } from "./deviceContext";
import { ClangProvider } from "./langService/clang";
import { ClangFormatter } from "./langService/clangFormatter";
import { CompletionProvider } from "./langService/completionProvider";
import { DefinitionProvider } from "./langService/definitionProvider";
import { FormatterProvider } from "./langService/formatterProvider";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import Telemetry from './applicationInsight/Telemetry'

export async function activate(context: vscode.ExtensionContext) {
    let activationTimer: Telemetry.TelemetryTimer = new Telemetry.TelemetryTimer();
    Telemetry.initialize(context);

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

    const arduinoManagerProvider = new ArduinoContentProvider(arduinoApp, boardManager, libraryManager, context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.showBoardManager", () => {
        Telemetry.sendTelemetryEvent("command.arduinoShowBoardManager");
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Boards Manager");
    }));

    context.subscriptions.push(vscode.commands.registerCommand("arduino.showLibraryManager", () => {
        Telemetry.sendTelemetryEvent("command.arduinoShowLibraryManager");
        return vscode.commands.executeCommand("vscode.previewHtml", LIBRARY_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Library Manager");
    }));

    // change board type
    context.subscriptions.push(vscode.commands.registerCommand("arduino.changeBoardType", async () => {
        let timer = new Telemetry.TelemetryTimer();
        await boardManager.changeBoardType();
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        Telemetry.sendTelemetryEvent("command.arduinoChangeBoardType", { board: boardManager.currentBoard.name }, { duration: timer.end() });
    }));

    context.subscriptions.push(vscode.commands.registerCommand("arduino.verify", async () => {
        let timer = new Telemetry.TelemetryTimer();
        await arduinoApp.verify();
        Telemetry.sendTelemetryEvent("command.arduinoVerify", { board: boardManager.currentBoard.name }, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.upload", async () => {
        let timer = new Telemetry.TelemetryTimer();
        await arduinoApp.upload();
        Telemetry.sendTelemetryEvent("command.arduinoUpload", { board: boardManager.currentBoard.name }, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.addLibPath", async (path) => {
        let timer = new Telemetry.TelemetryTimer();
        await arduinoApp.addLibPath(path);
        Telemetry.sendTelemetryEvent("command.arduinoAddLibPath", undefined, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.installBoard", async (packageName, arch, version?: string) => {
        let timer = new Telemetry.TelemetryTimer();
        await arduinoApp.installBoard(packageName, arch, version);
        arduinoManagerProvider.update(BOARD_MANAGER_URI);
        Telemetry.sendTelemetryEvent("command.arduinoInstallBoard", { packageName, arch, version }, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.uninstallBoard", (packagePath) => {
        let timer = new Telemetry.TelemetryTimer();
        arduinoApp.uninstallBoard(packagePath);
        arduinoManagerProvider.update(BOARD_MANAGER_URI);
        Telemetry.sendTelemetryEvent("command.arduinoUninstallBoard", { packagePath }, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.installLibrary", async (libName, version?: string) => {
        let timer = new Telemetry.TelemetryTimer();
        await arduinoApp.installLibrary(libName, version);
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        Telemetry.sendTelemetryEvent("command.arduinoInstallLibrary", { libName, version }, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.uninstallLibrary", (libPath) => {
        let timer = new Telemetry.TelemetryTimer();
        arduinoApp.uninstallLibrary(libPath);
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        Telemetry.sendTelemetryEvent("command.arduinoUninstallLibrary", { libPath }, { duration: timer.end() });
    }));

    // serial monitor commands
    const monitor = new SerialMonitor();
    context.subscriptions.push(vscode.commands.registerCommand("arduino.selectSerialPort", async () => {
        await monitor.selectSerialPort();
        Telemetry.sendTelemetryEvent("command.arduinoSelectSerialPort");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.openSerialMonitor", async () => {
        let timer = new Telemetry.TelemetryTimer();
        await monitor.openSerialMonitor();
        Telemetry.sendTelemetryEvent("command.arduinoOpenSerialMonitor", undefined, { duration: timer.end() });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.changeBaudRate", async () => {
        await monitor.changeBaudRate();
        Telemetry.sendTelemetryEvent("command.arduinoChangeBaudRate");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.sendMessageToSerialPort", async () => {
        await monitor.sendMessageToSerialPort();
        Telemetry.sendTelemetryEvent("command.arduinoSendMessageToSerialPort");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.closeSerialMonitor", async () => {
        await monitor.closeSerialMonitor();
        Telemetry.sendTelemetryEvent("command.arduinoCloseSerialMonitor");
    }));

    // Add arduino specific language suport.
    const clangProvider = new ClangProvider(arduinoApp);
    clangProvider.initialize();
    const completionProvider = new CompletionProvider(clangProvider);
    context.subscriptions.push(clangProvider);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));
    const definitionProvider = new DefinitionProvider(clangProvider);
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(ARDUINO_MODE, definitionProvider));
    const clangFormatter = new ClangFormatter(arduinoSettings);
    const formatterProvider = new FormatterProvider(clangFormatter);
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(ARDUINO_MODE, formatterProvider));

    // Example explorer, only work under VSCode insider version.
    if (typeof vscode.window.registerTreeExplorerNodeProvider === "function"
        && vscode.version.indexOf("insider") > -1) {
        const exampleProvider = require("./arduino/exampleProvider");
        vscode.window.registerTreeExplorerNodeProvider("arduinoExampleTree", new exampleProvider.ExampleProvider(arduinoSettings));
        // This command will be invoked using exactly the node you provided in `resolveChildren`.
        vscode.commands.registerCommand("arduino.openExample", (node) => {
            if (node.kind === "leaf") {
                vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(node.fullPath), true);
            }
        });
    }

    Telemetry.sendTelemetryEvent('activateExtension', {}, { duration: activationTimer.end() });
}


export function deactivate() {
    Telemetry.sendTelemetryEvent('deactivateExtension');
}