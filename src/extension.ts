// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as path from "path";
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";

import { ArduinoContentProvider } from "./arduino/arduinoContentProvider";
import ArduinoActivator from "./arduinoActivator";
import ArduinoContext from "./arduinoContext";
import {
    ARDUINO_CONFIG_FILE, ARDUINO_MANAGER_PROTOCOL, ARDUINO_MODE, BOARD_CONFIG_URI, BOARD_MANAGER_URI, EXAMPLES_URI,
    LIBRARY_MANAGER_URI,
} from "./common/constants";
import * as util from "./common/util";
import { DeviceContext } from "./deviceContext";
import { CompletionProvider } from "./langService/completionProvider";
import * as Logger from "./logger/logger";
import { SerialMonitor } from "./serialmonitor/serialMonitor";
import { UsbDetector } from "./serialmonitor/usbDetector";

const status: any = {};

export async function activate(context: vscode.ExtensionContext) {
    Logger.configure(context);
    const activeGuid = Uuid().replace(/-/g, "");
    Logger.traceUserData("start-activate-extension", {correlationId: activeGuid});
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

    const deviceContext = DeviceContext.getInstance();
    deviceContext.extensionPath = context.extensionPath;
    context.subscriptions.push(deviceContext);

    const arduinoManagerProvider = new ArduinoContentProvider(context.extensionPath);
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(ARDUINO_MANAGER_PROTOCOL, arduinoManagerProvider));

    const commandExecution = async (command: string, commandBody: (...args: any[]) => any, args: any, getUserData?: () => any) => {
        const guid = Uuid().replace(/\-/g, "");
        Logger.traceUserData(`start-command-` + command, {correlationId: guid});
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
            Logger.traceError("executeCommandError", error, {correlationId: guid, command});
        }

        Logger.traceUserData(`end-command-` + command, {
            ...telemetryResult,
            correlationId: guid,
            duration: timer1.end(),
        });
    };
    const registerArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!ArduinoContext.initialized) {
                await ArduinoActivator.activate();
            }

            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }

            await commandExecution(command, commandBody, args, getUserData);
        }));
    };

    const registerNonArduinoCommand = (command: string, commandBody: (...args: any[]) => any, getUserData?: () => any): number => {
        return context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: any[]) => {
            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            await commandExecution(command, commandBody, args, getUserData);
        }));
    };

    registerArduinoCommand("arduino.showBoardManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", BOARD_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Board Manager");
    });

    registerArduinoCommand("arduino.showLibraryManager", () => {
        return vscode.commands.executeCommand("vscode.previewHtml", LIBRARY_MANAGER_URI, vscode.ViewColumn.Two, "Arduino Library Manager");
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
            await ArduinoContext.boardManager.changeBoardType();
        } catch (exception) {
            Logger.error(exception.message);
        }
        arduinoManagerProvider.update(LIBRARY_MANAGER_URI);
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return {board: ArduinoContext.boardManager.currentBoard.name};
    });

    registerArduinoCommand("arduino.reloadExample", () => {
        arduinoManagerProvider.update(EXAMPLES_URI);
    }, () => {
        return {board: ArduinoContext.boardManager.currentBoard.name};
    });

    registerArduinoCommand("arduino.initialize", async () => await deviceContext.initialize());

    registerArduinoCommand("arduino.verify", async () => {
        if (!status.compile) {
            status.compile = "verify";
            try {
                await ArduinoContext.arduinoApp.verify();
            } catch (ex) {
            }
            delete status.compile;
        }
    }, () => {
        return {board: ArduinoContext.boardManager.currentBoard.name};
    });

    registerArduinoCommand("arduino.upload", async () => {
            if (!status.compile) {
                status.compile = "upload";
                try {
                    await ArduinoContext.arduinoApp.upload();
                } catch (ex) {
                }
                delete status.compile;
            }
        },
        () => {
            return {board: ArduinoContext.boardManager.currentBoard.name};
        });

    registerArduinoCommand("arduino.addLibPath", (path) => ArduinoContext.arduinoApp.addLibPath(path));
    registerArduinoCommand("arduino.openExample", (path) => ArduinoContext.arduinoApp.openExample(path));

    //  Arduino debugger
    registerArduinoCommand("arduino.debug.startSession", async (config) => {
        if (!status.debug) {
            status.debug = "debug";
            try {
                await ArduinoContext.arduinoConfigurator.run(config);
            } catch (ex) {
            }
            delete status.debug;

        }
    });

    // serial monitor commands
    const serialMonitor = SerialMonitor.getInstance();
    context.subscriptions.push(serialMonitor);
    registerNonArduinoCommand("arduino.selectSerialPort", () => serialMonitor.selectSerialPort(null, null));
    registerNonArduinoCommand("arduino.openSerialMonitor", () => serialMonitor.openSerialMonitor());
    registerNonArduinoCommand("arduino.changeBaudRate", () => serialMonitor.changeBaudRate());
    registerNonArduinoCommand("arduino.sendMessageToSerialPort", () => serialMonitor.sendMessageToSerialPort());
    registerNonArduinoCommand("arduino.closeSerialMonitor", (port) => serialMonitor.closeSerialMonitor(port));

    const completionProvider = new CompletionProvider();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ARDUINO_MODE, completionProvider, "<", '"', "."));

    UsbDetector.getInstance().initialize(context.extensionPath);
    UsbDetector.getInstance().startListening();

    if (vscode.workspace.rootPath && (
        util.fileExistsSync(path.join(vscode.workspace.rootPath, ARDUINO_CONFIG_FILE))
        || (openEditor && openEditor.document.fileName.endsWith(".ino")))) {
        (async () => {
            if (!ArduinoContext.initialized) {
                await ArduinoActivator.activate();
            }

            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            ArduinoContext.boardManager.updateStatusBar(true);
            vscode.commands.executeCommand("setContext",  "vscode-arduino:showExampleExplorer", true);
        })();
    }
    vscode.window.onDidChangeActiveTextEditor(async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && ((path.basename(activeEditor.document.fileName) === "arduino.json"
                && path.basename(path.dirname(activeEditor.document.fileName)) === ".vscode")
                || activeEditor.document.fileName.endsWith(".ino")
            )) {
            if (!ArduinoContext.initialized) {
                await ArduinoActivator.activate();
            }
            if (!SerialMonitor.getInstance().initialized) {
                SerialMonitor.getInstance().initialize();
            }
            ArduinoContext.boardManager.updateStatusBar(true);
            vscode.commands.executeCommand("setContext",  "vscode-arduino:showExampleExplorer", true);
        }
    });
    Logger.traceUserData("end-activate-extension", {correlationId: activeGuid});
}

export async function deactivate() {
    const monitor = SerialMonitor.getInstance();
    await monitor.closeSerialMonitor(null, false);
    UsbDetector.getInstance().stopListening();
    Logger.traceUserData("deactivate-extension");
}
