/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ArduinoApp } from "../arduino/arduino";
import { BoardManager } from "../arduino/boardManager";
import * as util from "../common/util";

export class UsbDetector {

    private _boardDescriptors = null;

    constructor(private _arduinoApp: ArduinoApp, private _boardManager: BoardManager, private _extensionRoot: string) {
    }

    public async startListening() {
        const usbDector = require("../../../vendor/node-usb-detection");

        usbDector.on("add", (device) => {
            if (device.vendorId && device.productId) {
                const deviceDescriptor = this.getUsbDeviceDescriptor(device.vendorId.toString(16),
                    device.productId.toString(16),
                    this._extensionRoot);

                // Not supported device for discovery.
                if (!deviceDescriptor) {
                    return;
                }
                const boardKey = `${deviceDescriptor.package}:${deviceDescriptor.architecture}:${deviceDescriptor.id}`;

                let bd = this._boardManager.installedBoards.get(boardKey);
                if (!bd) {
                    vscode.window.showInformationMessage(`Install board package for ${deviceDescriptor.name}`, "Yes", "No").then((ans) => {
                        if (ans === "Yes") {
                            this._arduinoApp.installBoard(deviceDescriptor.package, deviceDescriptor.architecture)
                                .then((res) => {
                                    this._boardManager.updateInstalledPlatforms(deviceDescriptor.package, deviceDescriptor.architecture);
                                    bd = this._boardManager.installedBoards.get(boardKey);
                                    this._boardManager.doChangeBoardType(bd);
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
                } else if (this._boardManager.currentBoard) {
                    const currBoard = this._boardManager.currentBoard;
                    if (currBoard.board !== deviceDescriptor.id
                        || currBoard.platform.architecture !== deviceDescriptor.architecture
                        || currBoard.platform.package.name !== deviceDescriptor.package) {
                        vscode.window.showInformationMessage(`Detected board ${deviceDescriptor.name}. Would you like to switch to this board type?`,
                            "Yes", "No")
                            .then((ans) => {
                                if (ans === "Yes") {
                                    return this._boardManager.doChangeBoardType(bd);
                                }
                            });
                    }
                } else {
                    this._boardManager.doChangeBoardType(bd);
                }
            }
        });
    }

    private getUsbDeviceDescriptor(vendorId: string, productId: string, extensionRoot: string): any {
        if (!this._boardDescriptors) {
            const fileContent = fs.readFileSync(path.join(extensionRoot, "misc", "usbmapping.json"), "utf8");
            this._boardDescriptors = JSON.parse(fileContent);
        }
        return this._boardDescriptors.find((obj) => {
            return obj.vid === vendorId && obj.pid === productId;
        });
    }
}
