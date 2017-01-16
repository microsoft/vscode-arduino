/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import vscode = require("vscode");
import settings = require("./arduino/settings");
import { addLibPath, outputChannel, upload, verify } from "./arduino/arduino";
import { IncludeCompletionProvider } from "./arduino/include";
import { changBaudRate, closeSerialPort, openSerialPort, sendMessageToSerialPort} from "./serialmonitor/serialportctrl";

export function activate(context: vscode.ExtensionContext) {
    let arduinoSettings = settings.ArduinoSettings.getIntance();
    vscode.commands.registerCommand("extension.verifyArduino", () => verify(arduinoSettings));
    vscode.commands.registerCommand("extension.uploadArduino", () => upload(arduinoSettings));
    vscode.commands.registerCommand("extension.addArduinoLibPath", () => addLibPath(arduinoSettings));

    // serial monitor commands
    context.subscriptions.push(vscode.commands.registerCommand("extension.openSerialPort", () => openSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.changBaudRate", () => changBaudRate()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.sendMessageToSerialPort", () => sendMessageToSerialPort()));
    context.subscriptions.push(vscode.commands.registerCommand("extension.stopSerialMonitor", () => closeSerialPort()));

    // Add arduino specific library file completion.
    const provider = new IncludeCompletionProvider();
    context.subscriptions.push(provider);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider("cpp", provider, "<", '"'));
}
