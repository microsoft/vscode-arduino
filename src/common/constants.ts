// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as vscode from "vscode";

export const ARDUINO_CONFIG_FILE = path.join(".vscode", "arduino.json");

export const CPP_CONFIG_FILE = path.join(".vscode", "c_cpp_properties.json");

export const ARDUINO_MODE: vscode.DocumentSelector = [
    { language: "cpp", scheme: "file" },
    { language: "arduino", scheme: "file" },
];

export const ARDUINO_MANAGER_PROTOCOL = "arduino-manager";
export const BOARD_MANAGER_URI = vscode.Uri.parse("arduino-manager://arduino/arduino-boardsmanager");
export const LIBRARY_MANAGER_URI = vscode.Uri.parse("arduino-manager://arduino/arduino-librariesmanager");
export const BOARD_CONFIG_URI = vscode.Uri.parse("arduino-manager://arduino/arduino-config");
export const EXAMPLES_URI = vscode.Uri.parse("arduino-manager://arduino/arduino-examples");

export const messages = {
    ARDUINO_FILE_ERROR: "The arduino.json file format is not correct.",
    NO_BOARD_SELECTED: "Please select the board type first.",
    INVALID_ARDUINO_PATH: "Cannot find Arduino IDE. Please specify the \"arduino.path\" in the User Settings. Requires a restart after change.",
    INVALID_COMMAND_PATH: "Please check the \"arduino.commandPath\" in the User Settings." +
"Requires a restart after change.Cannot find the command file:",
    FAILED_SEND_SERIALPORT: "Failed to send message to serial port.",
    SERIAL_PORT_NOT_STARTED: "Serial Monitor has not been started.",
    SEND_BEFORE_OPEN_SERIALPORT: "Please open a serial port first.",
    NO_PROGRAMMMER_SELECTED: "Please select the programmer first.",
    INVALID_OUTPUT_PATH: "Please check the \"output\" in the sketch Settings.Cannot find the output path:",
};

export const statusBarPriority = {
    ENDING: 20,
    BAUD_RATE: 21,
    PORT: 22,
    OPEN_PORT: 23,
    BOARD: 70,
    SKETCH: 80,
    PROGRAMMER: 90,
};

export const DEFAULT_BAUD_RATE: number = 115200;
export const SUPPORTED_BAUD_RATES: number[] = [ 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000 ];
export const DEFAULT_LINE_ENDING = "No line ending";