/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

import { ArduinoApp } from "./arduino/arduino";
import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import { BoardManager } from "./arduino/boardManager";
import { LibraryContentProvider } from "./arduino/libraryContentProvider";
import { LibraryManager } from "./arduino/libraryManager";
import { ArduinoSettings } from "./arduino/settings";
import { ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_MANAGER_URI, LIBRARY_MANAGER_PROTOCOL, LIBRARY_MANAGER_URI } from "./common/constants";
import { DeviceContext } from "./deviceContext";
import { ClangProvider } from "./langService/clang";
import { CompletionProvider } from "./langService/completionProvider";
import { DefinitionProvider } from "./langService/definitionProvider";
import { FormatterProvider } from "./langService/formatterProvider";
import { SerialMonitor } from "./serialmonitor/serialMonitor";

export async function activate(context: vscode.ExtensionContext) {
    const arduinoSettings = ArduinoSettings.getIntance();
    const arduinoApp = new ArduinoApp(arduinoSettings);
    await arduinoApp.initialize();

    // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
    let deviceContext = DeviceContext.getIntance();
    deviceContext.arduinoApp = arduinoApp;
    await deviceContext.loadContext();
    context.subscriptions.push(deviceContext);

    // Arduino board manager
    const boardManager = new BoardManager(arduinoSettings, arduinoApp);
    arduinoApp.boardManager = boardManager;
    await boardManager.loadPackages();
    const arduinoManagerProvider = new ArduinoContentProvider(boardManager, context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.showBoardManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Boards Manager");
    }));

    // Arduino library manager
    const libraryManager = new LibraryManager(arduinoSettings, arduinoApp, boardManager);
    const libraryProvider = new LibraryContentProvider(libraryManager, context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(LIBRARY_MANAGER_PROTOCOL, libraryProvider));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.showLibraryManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", LIBRARY_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Library Manager");
    }));

    // change board type
    context.subscriptions.push(vscode.commands.registerCommand("arduino.changeBoardType", () => {
        boardManager.changeBoardType();
        libraryProvider.update(LIBRARY_MANAGER_URI);
    }));

    context.subscriptions.push(arduinoSettings);
    context.subscriptions.push(vscode.commands.registerCommand("arduino.verify", () => arduinoApp.verify()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.upload", () => arduinoApp.upload()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.addLibPath", (path) => arduinoApp.addLibPath(path)));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.installBoard", async (packageName, arch, version?: string) => {
        await arduinoApp.installBoard(packageName, arch, version);
        arduinoManagerProvider.update(BOARD_MANAGER_URI);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.uninstallBoard", (packagePath) => {
        arduinoApp.uninstallBoard(packagePath);
        arduinoManagerProvider.update(BOARD_MANAGER_URI);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.installLibrary", async (libName) => {
        await arduinoApp.installLibrary(libName);
        libraryProvider.update(LIBRARY_MANAGER_URI);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.uninstallLibrary", (libPath) => {
        arduinoApp.uninstallLibrary(libPath);
        libraryProvider.update(LIBRARY_MANAGER_URI);
    }));

    // serial monitor commands
    const monitor = new SerialMonitor();
    context.subscriptions.push(vscode.commands.registerCommand("arduino.selectSerialPort", async () => await monitor.selectSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.openSerialMonitor", async () => await monitor.openSerialMonitor()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.changeBaudRate", async () => await monitor.changeBaudRate()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.sendMessageToSerialPort", async () =>
        await monitor.sendMessageToSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.closeSerialMonitor", async () => await monitor.closeSerialMonitor()));

    // Add arduino specific language suport.
    const clangProvider = new ClangProvider(arduinoApp);
    clangProvider.initialize();
    const completionProvider = new CompletionProvider(clangProvider);
    context.subscriptions.push(clangProvider);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));
    const definitionProvider = new DefinitionProvider(clangProvider);
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(ARDUINO_MODE, definitionProvider));
    const formatterProvider = new FormatterProvider();
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(ARDUINO_MODE, formatterProvider));

    // Example explorer, only work under VSCode insider version.
    if (typeof vscode.window.registerTreeExplorerNodeProvider === "function"
        && vscode.version.indexOf("insider") > -1) {
        const rootPath = vscode.workspace.rootPath;
        const exampleProvider = require("./arduino/exampleProvider");
        vscode.window.registerTreeExplorerNodeProvider("arduinoExampleTree", new exampleProvider.ExampleProvider(arduinoSettings));
        // This command will be invoked using exactly the node you provided in `resolveChildren`.
        vscode.commands.registerCommand("arduino.openExample", (node) => {
            if (node.kind === "leaf") {
                vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(node.fullPath), true);
            }
        });
    }
}
