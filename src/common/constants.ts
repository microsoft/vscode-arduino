/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as vscode from "vscode";

export const ARDUINO_CONFIG_FILE = path.join(".vscode", "arduino.json");

export const ARDUINO_MODE: vscode.DocumentSelector = [
    { language: "cpp", scheme: "file" },
    { language: "arduino", scheme: "file" },
];

export const ARDUINO_MANAGER_PROTOCOL = "arduino-manager";
export const BOARD_MANAGER_URI = vscode.Uri.parse("arduino-manager://arduino/packages");
export const LIBRARY_MANAGER_URI = vscode.Uri.parse("arduino-manager://arduino/libraries");

export const messages = {
    ARDUINO_FILE_ERROR: "The arduino.json file format is not correct.",
    NO_BOARD_SELECTED: "Please select the board type first.",
    INVALID_ARDUINO_PATH: "Cannot find the Arduino installation path. You can specify the path in the user settings.",
    FAILED_SEND_SERIALPORT: "Failed to send message to serial port.",
    SERIAL_PORT_NOT_STARTED: "Serial Monitor has not been started!",
    SEND_BEFORE_OPEN_SERIALPORT: "Please open a serial port first!",
};
