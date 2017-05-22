/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/
import * as path from "path";
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";
import { ArduinoActivator } from "./arduinoActivator";
import {
    ARDUINO_CONFIG_FILE, ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_CONFIG_URI,
    BOARD_MANAGER_URI, EXAMPLES_URI, LIBRARY_MANAGER_URI,
} from "./common/constants";
import * as util from "./common/util";
import { DeviceContext } from "./deviceContext";
import { CompletionProvider } from "./langService/completionProvider";
import * as Logger from "./logger/logger";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { UsbDetector } from "./serialmonitor/usbDetector";

let usbDetector: UsbDetector;
const status: any = {};

export async function activate(context: vscode.ExtensionContext) {
    Logger.configure(context);
    const activeGuid = Uuid().replace(/\-/g, "");
    Logger.traceUserData("start-activate-extension", { correlationId: activeGuid });

    // Show a warning message if the working file is not under the workspace folder.
    // People should know the extension might not work appropriately, they should look for the doc to get started.
    const openEditor = vscode.window.activeTextEditor;
    if (openEditor && openEditor.document.fileName.endsWith(".ino")) {
        const workingFile = path.normalize(openEditor.document.fileName);
        const workspaceFolder = (vscode.workspace && vscode.workspace.rootPath) || "";
        if (!workspaceFolder || workingFile.indexOf(path.normalize(workspaceFolder)) < 0) {
            vscode.window.showWarningMessage(`The working file "${workingFile}" is not under the workspace folder, ` +
                "the arduino extension might not work appropriately.");
        }
    }

    // TODO: After use the device.json config, should remove the dependency on the ArduinoApp object.
    const deviceContext = DeviceContext.getIntance();
    deviceContext.extensionPath = context.extensionPath;
    context.subscriptions.push(deviceContext);

    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL,
        ArduinoActivator.instance.arduinoContentProvider));
    const commandExection = async (command: string, commandBody: (...args: any[]) => any, args: any, getUserData?: () => any) => {
        const guid = Uuid().replace(/\-/g, "");
        Logger.traceUserData(`start-command-` + command, { correlationId: guid });
        const timer1 = new Logger.Timer();
        let telemetryResult;
        try {
            let result = commandBody(...args);
            if (result) {
                result = await Promise.resolve(result);
            }
            if (result && result.telemetry) {
                telemetryResult = result;
            } else if (getUserData) {
                telemetryResult = getUserData();
            }
        } catch (error) {
            Logger.traceError("executeCommandError", error, { correlationId: guid, command });
        }

        Logger.traceUserData(`end-command-` + command, { ...telemetryResult, correlationId: guid, duration: timer1.end() });
    };
    const registerArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!ArduinoActivator.instance.initialized) {
                await ArduinoActivator.instance.initialize();
            }

            ArduinoActivator.instance.boardManager.showStatusBar();

            if (!SerialMonitor.getIntance().initialized) {
                SerialMonitor.getIntance().initialize();
            }

            await commandExection(command, commandBody, args, getUserData);
        }));
    };

    const registerNonArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!SerialMonitor.getIntance().initialized) {
                SerialMonitor.getIntance().initialize();
            }
            await commandExection(command, commandBody, args, getUserData);
        }));
    };

    registerArduinoCommand("arduino.showBoardManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Boards Manager");
    });

    registerArduinoCommand("arduino.showLibraryManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", LIBRARY_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Libraries Manager");
    });

    registerArduinoCommand("arduino.showBoardConfig", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_CONFIG_URI, vscode.ViewColumn.Two, "Arduino Board Configuration");
    });

    registerArduinoCommand("arduino.showExamples", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", EXAMPLES_URI, vscode.ViewColumn.Two, "Arduino Examples");
    });

    // change board type
    registerArduinoCommand("arduino.changeBoardType", async () => {
        try {
            await ArduinoActivator.instance.boardManager.changeBoardType();
        } catch (exception) {
            Logger.error(exception.message);
        }
        ArduinoActivator.instance.arduinoContentProvider.update(LIBRARY_MANAGER_URI);
        ArduinoActivator.instance.arduinoContentProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: ArduinoActivator.instance.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.reloadExample", () => {
        ArduinoActivator.instance.arduinoContentProvider.update(EXAMPLES_URI);
    }, () => {
        return { board: ArduinoActivator.instance.boardManager.currentBoard.name };
    });

    registerArduinoCommand("arduino.initialize", async () => await deviceContext.initialize());

    registerArduinoCommand("arduino.verify", async () => {
        if (!status.compile) {
            status.compile = "verify";
            try {
                await ArduinoActivator.instance.arduinoApp.verify();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: ArduinoActivator.instance.currentBoardName };
    });

    registerArduinoCommand("arduino.upload", async () => {
        if (!status.compile) {
            status.compile = "upload";
            try {
                await ArduinoActivator.instance.arduinoApp.upload();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return { board: ArduinoActivator.instance.currentBoardName };
    });

    registerArduinoCommand("arduino.addLibPath", (path) => ArduinoActivator.instance.arduinoApp.addLibPath(path));

    //  Arduino debugger
    registerArduinoCommand("arduino.debug.startSession", async (config) => {
        if (!status.debug) {
            status.debug = "debug";
            try {
                await ArduinoActivator.instance.debugConfigurator.run(config);
            } catch (ex) {
            }
            delete status.debug;
        }
    });
    const completionProvider = new CompletionProvider();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));

    if (vscode.workspace.rootPath && (
        util.fileExistsSync(path.join(vscode.workspace.rootPath, ARDUINO_CONFIG_FILE))
        || (openEditor && openEditor.document.fileName.endsWith(".ino")))) {
        (async () => {
            if (!ArduinoActivator.instance.initialized) {
                await ArduinoActivator.instance.initialize();
            }

            ArduinoActivator.instance.boardManager.showStatusBar();
            if (!SerialMonitor.getIntance().initialized) {
                SerialMonitor.getIntance().initialize();
            }
        })();
    }

    // // serial monitor commands
    const serialMonitor = SerialMonitor.getIntance();
    context.subscriptions.push(serialMonitor);
    registerNonArduinoCommand("arduino.selectSerialPort", () => serialMonitor.selectSerialPort(null, null));
    registerNonArduinoCommand("arduino.openSerialMonitor", () => serialMonitor.openSerialMonitor());
    registerNonArduinoCommand("arduino.changeBaudRate", () => serialMonitor.changeBaudRate());
    registerNonArduinoCommand("arduino.sendMessageToSerialPort", () => serialMonitor.sendMessageToSerialPort());
    registerNonArduinoCommand("arduino.closeSerialMonitor", (port) => serialMonitor.closeSerialMonitor(port));

    usbDetector = new UsbDetector(context.extensionPath);
    usbDetector.startListening();
    Logger.traceUserData("end-activate-extension", { correlationId: activeGuid });
}

export async function deactivate() {
    const monitor = SerialMonitor.getIntance();
    await monitor.closeSerialMonitor(null, false);
    if (usbDetector) {
        usbDetector.stopListening();
    }
    Logger.traceUserData("deactivate-extension");
}
