/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import * as winston from "winston";

export default class UserNotificationTransport extends winston.Transport {

    constructor(options: any) {
        super(options);
    }

    protected log(level: string, message: string, metadata?: any, callback?: Function) {
        if (metadata && metadata.showUser) {
            let notification = (metadata && metadata.notification) ? metadata.notification : message;
            if (level === "warn") {
                vscode.window.showWarningMessage(message);
            } else if (level === "error") {
                vscode.window.showErrorMessage(message);
            } else {
                winston.error(`Invalid error level '${level}' for user notification.`);
            }
        }
        super.emit("logged");
        callback(null, true);
    }
}
