/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import TelemetryReporter from 'vscode-extension-telemetry'

export namespace Telemetry {
    let reporter: TelemetryReporter;
    let disabled: boolean;

    // Interface for package.json information
    interface IPackageInfo {
        name: string;
        version: string;
        aiKey: string;
    }

    export interface ITelemetryEventProperties {
        [key: string]: string;
    }

    export interface ITelemetryEventMeasures {
        [key: string]: number;
    }


    function getPackageInfo(context: vscode.ExtensionContext): IPackageInfo {
        let extensionPackage = require(context.asAbsolutePath('./package.json'));
        if (extensionPackage) {
            return {
                name: extensionPackage.name,
                version: extensionPackage.version,
                aiKey: extensionPackage.aiKey
            };
        }
    }

    export function initialize(context: vscode.ExtensionContext): void {
        if (typeof reporter === 'undefined') {
            // Check if the user has opted out of telemetry
            if (!vscode.workspace.getConfiguration('telemetry').get<boolean>('enableTelemetry', true)) {
                disable();
                return;
            }

            let packageInfo = getPackageInfo(context);
            if (!packageInfo.aiKey) {
                console.log('Failed to initialize telemetry due to no aiKey in package.json.');
                disable();
                return;
            }
            reporter = new TelemetryReporter(packageInfo.name, packageInfo.version, packageInfo.aiKey);
        }
    }

    /**
     * Filters error paths to only include source files. Exported to support testing
     */
    export function FilterErrorPath(line: string): string {
        if (line) {
            let values: string[] = line.split('/out/');
            if (values.length <= 1) {
                // Didn't match expected format
                return line;
            } else {
                return values[1];
            }
        }
    }

    /**
     * Send a telemetry event for an exception
     */
    export function sendTelemetryEventForException(err: any, methodName: string): void {
        try {
            let stackArray: string[];
            let firstLine: string = '';
            if (err !== undefined && err.stack !== undefined) {
                stackArray = err.stack.split('\n');
                if (stackArray !== undefined && stackArray.length >= 2) {
                    firstLine = stackArray[1]; // The fist line is the error message and we don't want to send that telemetry event
                    firstLine = FilterErrorPath(firstLine ? firstLine.replace(/\\/g, '/') : '');
                }
            }

            // Only adding the method name and the fist line of the stack trace.
            Telemetry.sendTelemetryEvent('Exception', { methodName: methodName, errorLine: firstLine });
            console.log('Unhandled Exception occurred. error: ' + err + ' method: ' + methodName);
        } catch (telemetryErr) {
            // If sending telemetry event fails ignore it so it won't break the extension
            console.log('Failed to send telemetry event. error: ' + telemetryErr);
        }
    }

    /**
    * Send a telemetry event using application insights
    */
    export function sendTelemetryEvent(
        eventName: string,
        properties?: ITelemetryEventProperties,
        measures?: ITelemetryEventMeasures): void {

        if (typeof disabled === 'undefined') {
            disabled = false;
        }
        if (disabled || typeof (reporter) === 'undefined') {
            // Don't do anything if telemetry is disabled
            return;
        }

        if (!properties || typeof properties === 'undefined') {
            properties = {};
        }
        try {
            reporter.sendTelemetryEvent(eventName, properties, measures);
        }  catch (telemetryErr) {
            // If sending telemetry event fails ignore it so it won't break the extension
            console.log('Failed to send telemetry event. error: ' + telemetryErr);
        }
    }

    /**
     * Disable telemetry reporting
     */
    export function disable(): void {
        disabled = true;
    }

    export class TelemetryTimer {
        private _startTime: [number, number];

        constructor() {
            this.start();
        }

        // Get the duration of time elapsed by the timer, in milliseconds
        public end(): number {
            if (!this._startTime) {
                return -1;
            } else {
                let endTime = process.hrtime(this._startTime);
                return  endTime[0] * 1000 + endTime[1] / 1000000;
            }
        }

        public start(): void {
            this._startTime = process.hrtime();
        }
    }

}

export default Telemetry;