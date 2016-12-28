'use strict';

import vscode = require('vscode');
import settings = require('./settings');

export function verify(arduinoConfig: settings.IArduinoSettings) {
    vscode.window.showInformationMessage(arduinoConfig.arduinoPath);
    return 'verify';
}

export function upload(arduinoConfig: settings.IArduinoSettings) {
    vscode.window.showInformationMessage(arduinoConfig.arduinoPath);
    return 'upload';
}
