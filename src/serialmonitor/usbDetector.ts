/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { ArduinoApp } from "../arduino/arduino";
import { BoardManager } from "../arduino/boardManager";
import { IBoard } from "../arduino/package";
import * as util from "../common/util";
import * as Logger from "../logger/logger";
import { SerialMonitor } from "./serialMonitor";

export class UsbDetector {

    private _usbDector;

    private _boardDescriptors = null;

    constructor(
        private _arduinoApp: ArduinoApp,
        private _boardManager: BoardManager,
        private _extensionRoot: string) {
    }

    public async startListening() {
        if (os.platform() === "linux") {
            return;
        }
        this._usbDector = require("../../../vendor/node-usb-native").detector;

        if (!this._usbDector) {
            return;
        }

        this._usbDector.on("add", (device) => {
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

                let bd = this._boardManager.installedBoards.get(boardKey);
                if (!bd) {
                    this._boardManager.updatePackageIndex(deviceDescriptor.indexFile).then((shouldLoadPackgeContent) => {
                        vscode.window.showInformationMessage(`Install board package for ${deviceDescriptor.name}`, "Yes", "No").then((ans) => {
                            if (ans === "Yes") {
                                this._arduinoApp.installBoard(deviceDescriptor.package, deviceDescriptor.architecture)
                                    .then(() => {
                                        if (shouldLoadPackgeContent) {
                                            this._boardManager.loadPackageContent(deviceDescriptor.indexFile);
                                        }
                                        this._boardManager.updateInstalledPlatforms(deviceDescriptor.package, deviceDescriptor.architecture);
                                        bd = this._boardManager.installedBoards.get(boardKey);
                                        this.switchBoard(bd, deviceDescriptor.vid, deviceDescriptor.pid);

                                        if (this._boardManager.currentBoard) {
                                            const readme = path.join(this._boardManager.currentBoard.platform.rootBoardPath, "README.md");
                                            if (util.fileExistsSync(readme)) {
                                                vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(readme));
                                            }
                                            vscode.commands.executeCommand("arduino.showExamples");
                                        }
                                    });
                            }
                        });
                    });
                } else if (this._boardManager.currentBoard) {
                    const currBoard = this._boardManager.currentBoard;
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
                        const monitor = SerialMonitor.getIntance();
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
        if (this._usbDector) {
            this._usbDector.stopMonitoring();
        }
    }

    private switchBoard(bd: IBoard, vid: string, pid: string) {
        this._boardManager.doChangeBoardType(bd);
        const monitor = SerialMonitor.getIntance();
        monitor.selectSerialPort(vid, pid);
        this.showReadMeAndExample();
    }

    private showReadMeAndExample() {
        if (this._boardManager.currentBoard) {
            const readme = path.join(this._boardManager.currentBoard.platform.rootBoardPath, "README.md");
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
