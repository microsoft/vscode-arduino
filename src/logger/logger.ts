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

export function info(msg: string, meta?: any) {
    winston.info(msg, meta);
}

export function debug(msg: string, meta?: any) {
    winston.debug(msg, meta);
}

export function warn(msg: string, meta?: any) {
    winston.warn(msg, meta);
}

export function verbose(msg: string, meta?: any) {
    winston.verbose(msg, meta);
}

export function error(msg: string, meta?: any) {
    winston.error(msg, meta);
}

export function silly(msg: string, meta?: any) {
    winston.silly(msg, meta);
}

export function traceUserData(msg: string, meta?: any) {
    // use `info` as the log level and add a special flag in meta
    winston.log("info", msg, { ...meta, telemetry: true });
}

export function traceError(err: Error, meta?: any) {
    // use `info` as the log level and add a special flag in meta
    let stackArray: string[];
    let firstLine: string = "";
    if (err !== undefined && err.stack !== undefined) {
        stackArray = err.stack.split("\n");
        if (stackArray !== undefined && stackArray.length >= 2) {
            firstLine = stackArray[1]; // The fist line is the error message and we don't want to send that telemetry event
            firstLine = FilterErrorPath(firstLine ? firstLine.replace(/\\/g, "/") : "");
        }
    }
    winston.log("error", err.message || "exception", { ...meta, firstLine, telemetry: true });
}

export function notifyAndThrowUserError(err: Error) {
    traceError(err, { showUser: true });
    throw err;
}

export function notifyUserError(err: Error) {
    traceError(err, { showUser: true });
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
