'use strict';

import vscode = require('vscode');
import * as settings from './arduino/settings';
import { verify, upload } from './arduino/arduino'; 

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let arduinoSettings = settings.ArduinoSettings.getIntance();

    vscode.commands.registerCommand('extension.verifyArduino', () => {
        return verify(arduinoSettings);
    });

    vscode.commands.registerCommand('extension.uploadArduino', () => {
        return upload(arduinoSettings);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}