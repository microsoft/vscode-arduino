import * as path from 'path'
import * as vscode from 'vscode'
import TelemetryTransport from './telemetry-transport'
import * as winston from 'winston';
export namespace Logger {
    export function configure(context: vscode.ExtensionContext) {
        winston.configure({
            transports: [
                new (winston.transports.File)({ level: 'warn', filename: path.join('arduino.log') }),
                new TelemetryTransport({ level: 'info', context: context })
            ]
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
        winston.log('info', msg, { ...meta, telemetry: true });
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
}

export default Logger;