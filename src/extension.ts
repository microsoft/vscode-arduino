/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import vscode = require("vscode");
import settings = require("./arduino/settings");
import { addLibPath, upload, verify } from "./arduino/arduino";
import { CompletionProvider } from "./arduino/completionProvider";
import { DefinitionProvider } from "./arduino/definitionProvider";
import { changBaudRate, closeSerialPort, openSerialPort, sendMessageToSerialPort } from "./serialmonitor/serialportctrl";

export function activate(context: vscode.ExtensionContext) {
    let arduinoSettings = settings.ArduinoSettings.getIntance();
    context.subscriptions.push(arduinoSettings);
    context.subscriptions.push(vscode.commands.registerCommand("extension.verifyArduino", () => verify(arduinoSettings)));
    context.subscriptions.push(vscode.commands.registerCommand("extension.uploadArduino", () => upload(arduinoSettings)));
    context.subscriptions.push(vscode.commands.registerCommand("extension.addArduinoLibPath", () => addLibPath(arduinoSettings)));

    // serial monitor commands
    context.subscriptions.push(vscode.commands.registerCommand("extension.openSerialPort", () => openSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.changBaudRate", () => changBaudRate()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.sendMessageToSerialPort", () => sendMessageToSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.closeSerialPort", () => closeSerialPort()));

    // Add arduino specific language suport.
    const completionProvider = new CompletionProvider();
    context.subscriptions.push(completionProvider);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider("cpp", completionProvider, "<", '"', "."));
    const definitionProvider = new DefinitionProvider();
    context.subscriptions.push(vscode.languages.registerDefinitionProvider("cpp", definitionProvider));
}
