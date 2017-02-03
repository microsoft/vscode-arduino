/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

import { addLibPath, upload, verify } from "./arduino/arduino";
import { CompletionProvider } from "./arduino/completionProvider";
import { DefinitionProvider } from "./arduino/definitionProvider";
import * as settings from "./arduino/settings";
import { ARDUINO_MODE } from "./common/constants";
import { changeBaudRate, closeSerialPort, openSerialPort, sendMessageToSerialPort } from "./serialmonitor/serialportctrl";

export function activate(context: vscode.ExtensionContext) {
    let arduinoSettings = settings.ArduinoSettings.getIntance();
    context.subscriptions.push(arduinoSettings);
    context.subscriptions.push(vscode.commands.registerCommand("arduino.verify", () => verify(arduinoSettings)));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.upload", () => upload(arduinoSettings)));
    context.subscriptions.push(vscode.commands.registerCommand("arduino.addLibPath", () => addLibPath(arduinoSettings)));

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
    if (typeof vscode.window.registerTreeExplorerNodeProvider === "function") {
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
