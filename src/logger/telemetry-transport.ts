// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import TelemetryReporter from "@vscode/extension-telemetry";
import * as vscode from "vscode";
import * as winston from "winston";
import { LogLevel } from "./logger";
interface IPackageInfo {
    name: string;
    version: string;
    aiKey: string;
}

function getPackageInfo(context: vscode.ExtensionContext): IPackageInfo {
    const packageJson = context.extension.packageJSON;
    return {
        name: context.extension.id,
        version: packageJson.version,
        aiKey: packageJson.aiKey,
    };
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

export class TelemetryTransport extends winston.Transport {
    private reporter: TelemetryReporter;
    constructor(options: any) {
        super({ ...options, context: null });
        this.name = "telemetry";
        if (!options.context) {
            winston.error("Failed to initialize telemetry, please set the vscode context in options.");
            return;
        }
        const packageInfo = getPackageInfo(options.context);
        if (!packageInfo.aiKey) {
            winston.error("Failed to initialize telemetry due to no aiKey in package.json.");
            return;
        }
        this.reporter = new TelemetryReporter(
            packageInfo.name, packageInfo.version, packageInfo.aiKey, true,
            // These are potentially sensitive fields from errors that should be filtered out.
            [{ lookup: /^(message|notification|errorLine)$/ }]);
    }

    protected log(level: string, message: string, metadata?: any, callback?: (arg1, arg2) => void) {
        if (this.reporter && metadata && metadata.telemetry) {
            try {
                delete metadata.telemetry;
                const properties: { [key: string]: string; } = { level };
                const measures: { [key: string]: number; } = {};
                for (const key of Object.keys(metadata)) {
                    if (typeof key === "string") {
                        const value = metadata[key];
                        if (value === null || typeof value === "string" || value instanceof String) {
                            properties[key] = value;
                        } else if (isNumeric(value)) {
                            measures[key] = value;
                        } else {
                            winston.debug(`Ignore log(${key} = ${value}) since the value type are not supported.`);
                        }
                    }
                }
                if (level === LogLevel.Info) {
                    this.reporter.sendTelemetryEvent(message, properties, measures);
                } else {
                    this.reporter.sendTelemetryErrorEvent(message, properties, measures);
                }
            } catch (telemetryErr) {
                // If sending telemetry event fails ignore it so it won"t break the extension
                winston.error("Failed to send telemetry event. error: " + telemetryErr);
            }
        }
        super.emit("logged");
        if (callback) {
            callback(null, true);
        }
    }
}

export default TelemetryTransport;
