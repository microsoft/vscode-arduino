// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { IBoard } from "../arduino/package";
import { VscodeSettings } from "../arduino/vscodeSettings";
import ArduinoActivator from "../arduinoActivator";
import ArduinoContext from "../arduinoContext";
import { ARDUINO_CONFIG_FILE } from "../common/constants";
import { ArduinoWorkspace } from "../common/workspace";

import * as util from "../common/util";
import * as Logger from "../logger/logger";
import { SerialMonitor } from "./serialMonitor";

const HTML_EXT = ".html";
const MARKDOWN_EXT = ".md";

export class UsbDetector {
    public static getInstance(): UsbDetector {
        if (!UsbDetector._instance) {
            UsbDetector._instance = new UsbDetector();
        }
        return UsbDetector._instance;
    }

    private static _instance: UsbDetector;

    private _usbDetector;

    private _boardDescriptors = null;

    private _extensionRoot = null;

    private _extensionContext = null;

    private constructor() {
    }

    public initialize(extensionContext: vscode.ExtensionContext) {
        this._extensionRoot = extensionContext.extensionPath;
        this._extensionContext = extensionContext;
    }

    public async startListening() {
        const enableUSBDetection = VscodeSettings.getInstance().enableUSBDetection;
        if (os.platform() === "linux" || !enableUSBDetection) {
            return;
        }
        this._usbDetector = require("usb-detection");

        if (!this._usbDetector) {
            return;
        }

        if (this._extensionRoot === null) {
            throw new Error("UsbDetector should be initialized before using.");
        }

        this._usbDetector.on("add", async (device) => {
            if (device.vendorId && device.productId) {
                const deviceDescriptor = this.getUsbDeviceDescriptor(
                    util.convertToHex(device.vendorId, 4), // vid and pid both are 2 bytes long.
                    util.convertToHex(device.productId, 4),
                    this._extensionRoot);

                // Not supported device for discovery.
                if (!deviceDescriptor) {
                    return;
                }
                const boardKey = `${deviceDescriptor.package}:${deviceDescriptor.architecture}:${deviceDescriptor.id}`;
                Logger.traceUserData("detected a board", { board: boardKey });
                if (!ArduinoContext.initialized) {
                    await ArduinoActivator.activate();
                }
                if (!SerialMonitor.getInstance().initialized) {
                    SerialMonitor.getInstance().initialize(this._extensionContext);
                }

                // TODO EW: this is board manager code which should be moved into board manager

                let bd = ArduinoContext.boardManager.installedBoards.get(boardKey);
                const openEditor = vscode.window.activeTextEditor;
                if (ArduinoWorkspace.rootPath && (
                    util.fileExistsSync(path.join(ArduinoWorkspace.rootPath, ARDUINO_CONFIG_FILE))
                    || (openEditor && openEditor.document.fileName.endsWith(".ino")))) {
                if (!bd) {
                    ArduinoContext.boardManager.updatePackageIndex(deviceDescriptor.indexFile).then((shouldLoadPackageContent) => {
                        const ignoreBoards = VscodeSettings.getInstance().ignoreBoards || [];
                        if (ignoreBoards.indexOf(deviceDescriptor.name) >= 0) {
                            return;
                        }
                        vscode.window.showInformationMessage(`Install board package for ${
                                deviceDescriptor.name}`, "Yes", "No", "Don't ask again").then((ans) => {
                            if (ans === "Yes") {
                                ArduinoContext.arduinoApp.installBoard(deviceDescriptor.package, deviceDescriptor.architecture)
                                    .then(() => {
                                        if (shouldLoadPackageContent) {
                                            ArduinoContext.boardManager.loadPackageContent(deviceDescriptor.indexFile);
                                        }
                                        ArduinoContext.boardManager.updateInstalledPlatforms(deviceDescriptor.package, deviceDescriptor.architecture);
                                        bd = ArduinoContext.boardManager.installedBoards.get(boardKey);
                                        this.switchBoard(bd, deviceDescriptor);
                                    });
                            } else if (ans === "Don't ask again") {
                                ignoreBoards.push(deviceDescriptor.name);
                                VscodeSettings.getInstance().ignoreBoards = ignoreBoards;
                            }
                        });
                    });
                } else if (ArduinoContext.boardManager.currentBoard) {
                    const currBoard = ArduinoContext.boardManager.currentBoard;
                    if (currBoard.board !== deviceDescriptor.id
                        || currBoard.platform.architecture !== deviceDescriptor.architecture
                        || currBoard.getPackageName() !== deviceDescriptor.package) {
                        const ignoreBoards = VscodeSettings.getInstance().ignoreBoards || [];
                        if (ignoreBoards.indexOf(deviceDescriptor.name) >= 0) {
                            return;
                        }
                        vscode.window.showInformationMessage(`Detected board ${deviceDescriptor.name}. Would you like to switch to this board type?`,
                            "Yes", "No", "Don't ask again")
                            .then((ans) => {
                                if (ans === "Yes") {
                                    return this.switchBoard(bd, deviceDescriptor);
                                } else if (ans === "Don't ask again") {
                                    ignoreBoards.push(deviceDescriptor.name);
                                    VscodeSettings.getInstance().ignoreBoards = ignoreBoards;
                                }
                            });
                    } else {
                        this.showReadMeAndExample(deviceDescriptor.readme);
                    }
                } else {
                    this.switchBoard(bd, deviceDescriptor);
                }
            }
        }
        });
        this._usbDetector.startMonitoring();
    }

    public stopListening() {
        if (this._usbDetector) {
            this._usbDetector.stopMonitoring();
        }
    }

    public pauseListening() {
        if (this._usbDetector) {
            this._usbDetector.stopMonitoring();
        }
    }

    public resumeListening() {
        if (this._usbDetector) {
            this._usbDetector.startMonitoring();
        } else {
            this.startListening();
        }
    }

    private switchBoard(bd: IBoard, deviceDescriptor, showReadMe: boolean = true) {
        ArduinoContext.boardManager.doChangeBoardType(bd);
        if (showReadMe) {
            this.showReadMeAndExample(deviceDescriptor.readme);
        }
    }

    private showReadMeAndExample(readme: string|undefined) {
        if (ArduinoContext.boardManager.currentBoard) {
            let readmeFilePath = "";
            if (readme) {
                readmeFilePath = path.join(ArduinoContext.boardManager.currentBoard.platform.rootBoardPath, readme);
            }
            if (!readmeFilePath || !util.fileExistsSync(readmeFilePath)) {
                readmeFilePath = path.join(ArduinoContext.boardManager.currentBoard.platform.rootBoardPath, "README.md");
            }
            vscode.commands.executeCommand("arduino.showExamples", true);
            if (util.fileExistsSync(readmeFilePath)) {
                if (readmeFilePath.endsWith(MARKDOWN_EXT)) {
                    vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(readmeFilePath));
                } else if (readmeFilePath.endsWith(HTML_EXT)) {
                    const panel = vscode.window.createWebviewPanel("arduinoBoardReadMe", "", vscode.ViewColumn.One, {
                        enableScripts: true,
                        retainContextWhenHidden: true,
                    });
                    panel.webview.html = fs.readFileSync(readmeFilePath, "utf8");
                }
            }
        }
    }

    private getUsbDeviceDescriptor(vendorId: string, productId: string, extensionRoot: string): any {
        if (!this._boardDescriptors) {
            this._boardDescriptors = [];
            const fileContent = fs.readFileSync(path.join(extensionRoot, "misc", "usbmapping.json"), "utf8");
            const boardIndexes = JSON.parse(fileContent);
            boardIndexes.forEach((boardIndex) => {
                boardIndex.boards.forEach((board) => board.indexFile = boardIndex.index_file);
                this._boardDescriptors = this._boardDescriptors.concat(boardIndex.boards);
            });
        }
        return this._boardDescriptors.find((obj) => {
            return obj.vid === vendorId && (obj.pid === productId || (obj.pid.indexOf && obj.pid.indexOf(productId) >= 0));
        });
    }
}
