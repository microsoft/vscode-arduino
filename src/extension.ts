/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

import vscode = require("vscode");
import settings = require("./arduino/settings");
import { addLibPath, upload, verify } from "./arduino/arduino";
import { CompletionProvider } from "./arduino/completionProvider";
import { DefinitionProvider } from "./arduino/definitionProvider";

export function activate(context: vscode.ExtensionContext) {
    let arduinoSettings = settings.ArduinoSettings.getIntance();
    vscode.commands.registerCommand("extension.verifyArduino", () => verify(arduinoSettings));
    vscode.commands.registerCommand("extension.uploadArduino", () => upload(arduinoSettings));
    vscode.commands.registerCommand("extension.addArduinoLibPath", () => addLibPath(arduinoSettings));

    // Add arduino specific library file completion.
    const completionProvider = new CompletionProvider();
    context.subscriptions.push(completionProvider);
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider("cpp", completionProvider, "<", '"', "."));

    const definitionProvider = new DefinitionProvider();
    context.subscriptions.push(vscode.languages.registerDefinitionProvider("cpp", definitionProvider));
}
