import * as path from "path";
import * as vscode from "vscode";
import * as winston from "winston";
import TelemetryTransport from "./telemetry-transport";

function FilterErrorPath(line: string): string {
    if (line) {
        let values: string[] = line.split("/out/");
        if (values.length <= 1) {
            // Didn't match expected format
            return line;
        } else {
            return values[1];
        }
    }
}

export function configure(context: vscode.ExtensionContext) {
    winston.configure({
        transports: [
            new (winston.transports.File)({ level: "warn", filename: context.asAbsolutePath("arduino.log") }),
            new TelemetryTransport({ level: "info", context }),
        ],
    });
}

export function info(message: string, metadata?: any) {
    winston.info(message, metadata);
}

export function debug(message: string, metadata?: any) {
    winston.debug(message, metadata);
}

export function warn(message: string, metadata?: any) {
    winston.warn(message, metadata);
}

export function verbose(message: string, metadata?: any) {
    winston.verbose(message, metadata);
}

export function error(message: string, metadata?: any) {
    winston.error(message, metadata);
}

export function silly(message: string, metadata?: any) {
    winston.silly(message, metadata);
}

export function traceUserData(message: string, metadata?: any) {
    // use `info` as the log level and add a special flag in metadata
    winston.log("info", message, { ...metadata, telemetry: true });
}

export function traceErrorOrWarning(level: string, message: string, err: Error, metadata?: any) {
    // use `info` as the log level and add a special flag in metadata
    let stackArray: string[];
    let firstLine: string = "";
    if (err !== undefined && err.stack !== undefined) {
        stackArray = err.stack.split("\n");
        if (stackArray !== undefined && stackArray.length >= 2) {
            firstLine = stackArray[1]; // The fist line is the error message and we don't want to send that telemetry event
            firstLine = FilterErrorPath(firstLine ? firstLine.replace(/\\/g, "/") : "");
        }
    }
    winston.log(level, err.message || "unknown error", { ...metadata, firstLine, telemetry: true });
}

export function notifyAndThrowUserError(message: string, err: Error) {
    notifyUserError(message, err);
    throw err;
}

export function notifyUserError(message: string, err: Error) {
    traceErrorOrWarning("error", message, err, { showUser: true, telemetry: true });
}

export function notifyUserWarning(message: string, err: Error) {
    traceErrorOrWarning("warn", message, err, { showUser: true, telemetry: true });
}

export class Timer {
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
            return endTime[0] * 1000 + endTime[1] / 1000000;
        }
    }

    public start(): void {
        this._startTime = process.hrtime();
    }
}
