// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import * as winston from "winston";
import { LogLevel } from "./logger";

export default class UserNotificationTransport extends winston.Transport {

    constructor(options: any) {
        super(options);
    }

    protected log(level: string, message: string, metadata?: any, callback?: (arg1, arg2) => void) {
        if (metadata && metadata.showUser) {
            const notification = (metadata && metadata.notification) ? metadata.notification : message;
            if (level === LogLevel.Warn) {
                vscode.window.showWarningMessage(notification);
            } else if (level === LogLevel.Error) {
                vscode.window.showErrorMessage(notification);
            } else {
                winston.error(`Invalid error level '${level}' for user notification.`);
            }
        }
        super.emit("logged");
        if (callback) {
            callback(null, true);
        }
    }
}
