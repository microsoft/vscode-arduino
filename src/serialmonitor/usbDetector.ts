/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { IBoard } from "../arduino/package";
import { ArduinoActivator, ArduinoContext } from "../arduinoActivator";
import * as util from "../common/util";
import * as Logger from "../logger/logger";
import { SerialMonitor } from "./serialMonitor";

export class UsbDetector {

    private _usbDetector;

    private _boardDescriptors = null;

    constructor(
        private _extensionRoot: string) {
    }

    public async startListening() {
        if (os.platform() === "linux") {
            return;
        }
        this._usbDetector = require("../../../vendor/node-usb-native").detector;

        if (!this._usbDetector) {
            return;
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
                    SerialMonitor.getInstance().initialize();
                }
                let bd = ArduinoContext.boardManager.installedBoards.get(boardKey);
                if (!bd) {
                    ArduinoContext.boardManager.updatePackageIndex(deviceDescriptor.indexFile).then((shouldLoadPackgeContent) => {
                        vscode.window.showInformationMessage(`Install board package for ${deviceDescriptor.name}`, "Yes", "No").then((ans) => {
                            if (ans === "Yes") {
                                ArduinoContext.arduinoApp.installBoard(deviceDescriptor.package, deviceDescriptor.architecture)
                                    .then(() => {
                                        if (shouldLoadPackgeContent) {
                                            ArduinoContext.boardManager.loadPackageContent(deviceDescriptor.indexFile);
                                        }
                                        ArduinoContext.boardManager.updateInstalledPlatforms(deviceDescriptor.package, deviceDescriptor.architecture);
                                        bd = ArduinoContext.boardManager.installedBoards.get(boardKey);
                                        this.switchBoard(bd, deviceDescriptor.vid, deviceDescriptor.pid);

                                        if (ArduinoContext.boardManager.currentBoard) {
                                            const readme = path.join(ArduinoContext.boardManager.currentBoard.platform.rootBoardPath, "README.md");
                                            if (util.fileExistsSync(readme)) {
                                                vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(readme));
                                            }
                                            vscode.commands.executeCommand("arduino.showExamples");
                                        }
                                    });
                            }
                        });
                    });
                } else if (ArduinoContext.boardManager.currentBoard) {
                    const currBoard = ArduinoContext.boardManager.currentBoard;
                    if (currBoard.board !== deviceDescriptor.id
                        || currBoard.platform.architecture !== deviceDescriptor.architecture
                        || currBoard.getPackageName() !== deviceDescriptor.package) {
                        vscode.window.showInformationMessage(`Detected board ${deviceDescriptor.name}. Would you like to switch to this board type?`,
                            "Yes", "No")
                            .then((ans) => {
                                if (ans === "Yes") {
                                    return this.switchBoard(bd, deviceDescriptor.vid, deviceDescriptor.pid);
                                }
                            });
                    } else {
                        const monitor = SerialMonitor.getInstance();
                        monitor.selectSerialPort(deviceDescriptor.vid, deviceDescriptor.pid);
                        this.showReadMeAndExample();
                    }
                } else {
                    this.switchBoard(bd, deviceDescriptor.vid, deviceDescriptor.pid);
                }
            }
        });
    }

    public stopListening() {
        if (this._usbDetector) {
            this._usbDetector.stopMonitoring();
        }
    }

    private switchBoard(bd: IBoard, vid: string, pid: string) {
        ArduinoContext.boardManager.doChangeBoardType(bd);
        const monitor = SerialMonitor.getInstance();
        monitor.selectSerialPort(vid, pid);
        this.showReadMeAndExample();
    }

    private showReadMeAndExample() {
        if (ArduinoContext.boardManager.currentBoard) {
            const readme = path.join(ArduinoContext.boardManager.currentBoard.platform.rootBoardPath, "README.md");
            if (util.fileExistsSync(readme)) {
                vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(readme));
            }
            vscode.commands.executeCommand("arduino.reloadExample");
            vscode.commands.executeCommand("arduino.showExamples");
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
