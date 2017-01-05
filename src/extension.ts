import vscode = require("vscode");
import { outputChannel, upload, verify } from "./arduino/arduino";
import * as settings from "./arduino/settings";

export function activate(context: vscode.ExtensionContext) {
    let arduinoSettings = settings.ArduinoSettings.getIntance();
    vscode.commands.registerCommand("extension.verifyArduino", () => verify(arduinoSettings));
    vscode.commands.registerCommand("extension.uploadArduino", () => upload(arduinoSettings));
}
