/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

import { ArduinoApp } from "./arduino/arduino";
import { BoardContentProvider } from "./arduino/boardContentProvider";
import { BoardManager } from "./arduino/boardManager";
import { CompletionProvider } from "./arduino/completionProvider";
import { DefinitionProvider } from "./arduino/definitionProvider";
import { ArduinoSettings } from "./arduino/settings";
import { ARDUINO_MODE, BOARD_MANAGER_PROTOCOL, BOARD_MANAGER_URI } from "./common/constants";
import { DeviceContext } from "./deviceContext";
import { changeBaudRate, closeSerialPort, openSerialPort, sendMessageToSerialPort } from "./serialmonitor/serialportctrl";

export async function activate(context: vscode.ExtensionContext) {
    const arduinoSettings = ArduinoSettings.getIntance();
    const arduinoApp = new ArduinoApp(arduinoSettings);

    // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
    let deviceContext = DeviceContext.getIntance();
    deviceContext.arduinoApp = arduinoApp;
    await deviceContext.loadContext();

    // Arduino board manager:
    const boardManger = new BoardManager(arduinoSettings, arduinoApp);
    arduinoApp.boardManager = boardManger;
    const packageProvider = new BoardContentProvider(boardManger, context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(BOARD_MANAGER_PROTOCOL, packageProvider));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.changeBoardType", () => boardManger.changeBoardType()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.showBoardManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Boards Manager");
    }));

    context.subscriptions.push(arduinoSettings);
    context.subscriptions.push(vscode.commands.registerCommand("arduino.verify", () => arduinoApp.verify()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.upload", () => arduinoApp.upload()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.addLibPath", () => arduinoApp.addLibPath()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.installBoard", async (packageName, arch) => {
        await arduinoApp.installBoard(packageName, arch);
        packageProvider.update(BOARD_MANAGER_URI);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.uninstallBoard", (packagePath) => {
        arduinoApp.uninstallBoard(packagePath);
        packageProvider.update(BOARD_MANAGER_URI);
    }));

    // serial monitor commands
    context.subscriptions.push(vscode.commands.registerCommand("arduino.openSerialPort", () => openSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.changeBaudRate", () => changeBaudRate()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.sendMessageToSerialPort", () => sendMessageToSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.closeSerialPort", () => closeSerialPort()));

    // Add arduino specific language suport.
    const completionProvider = new CompletionProvider();
    context.subscriptions.push(completionProvider);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));
    const definitionProvider = new DefinitionProvider();
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(ARDUINO_MODE, definitionProvider));

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
