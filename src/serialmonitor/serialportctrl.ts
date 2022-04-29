// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as os from "os";
import { SerialPort } from "serialport";
import * as strftime from "strftime";
import { BufferedOutputChannel } from "./outputBuffer";

interface ISerialPortDetail {
  port: string;
  desc: string;
  vendorId: string;
  productId: string;
}

export class SerialPortCtrl {

/**
 * Check which external serial devices are connected.
 *
 * @returns An array of ISerialPortDetail from external serial devices.
 *
 */
  public static async list(): Promise<ISerialPortDetail[]> {
    return (await SerialPort.list()).map((port) => {
      return {
        port: port.path,
        desc: (port as any).friendlyName ?? port.manufacturer,
        vendorId: port.vendorId,
        productId: port.productId,
      };
    });
  }

  private _port?: SerialPort;
  private _currentPort: string;
  private _currentBaudRate: number;
  private _currentTimestampFormat: string;

  public constructor(
      port: string,
      baudRate: number,
      timestampFormat: string,
      private _bufferedOutputChannel: BufferedOutputChannel,
      private showOutputChannel: (preserveFocus?: boolean) => void) {
    this._currentBaudRate = baudRate;
    this._currentPort = port;
    this._currentTimestampFormat = timestampFormat;
  }

  public get isActive(): boolean {
    return this._port?.isOpen ?? false;
  }

  public get currentPort(): string {
    return this._currentPort;
  }

  public async open(): Promise<void> {
    this._bufferedOutputChannel.appendLine(`[Starting] Opening the serial port - ${this._currentPort}`);
    this.showOutputChannel();

    if (this.isActive) { await this.close(); }

    await new Promise<void>((resolve, reject) => {
      this._port = new SerialPort(
        { autoOpen: false, path: this._currentPort, baudRate: this._currentBaudRate },
        (err) => {
          if (err) { reject(err); }
        });
      this._port.open((err) => {
        if (err) {
          reject(err);
        } else {
          // These pins are tied to boot and reset on some devices like the
          // ESP32. We need to pull them high to avoid unexpected behavior when
          // opening the serial monitor.
          this._port.set({ dtr: true, cts: true, rts: true }, (err2) => {
            if (err2) {
              reject(err2);
            } else {
              resolve();
            }
          });
        }
      });
    });

    let lastDataEndedWithNewline = true;
    this._port.on("data", (data) => {
      const text: string = data.toString("utf8");
      if (this._currentTimestampFormat) {
        const timestamp = strftime(this._currentTimestampFormat);
        this._bufferedOutputChannel.append(
          // Timestamps should only be added at the beginning of a line.
          // Look for newlines except at the very end of the string.
          (lastDataEndedWithNewline ? timestamp : "") +
          text.replace(/\n(?!$)/g, "\n" + timestamp),
        );
        lastDataEndedWithNewline = text.endsWith("\n");
      } else {
        this._bufferedOutputChannel.append(text);
      }
    });
  }

  public sendMessage(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text || !this.isActive) {
        resolve();
        return;
      }
      this._port.write(text + "\n", (error) => {
        if (!error) {
          resolve();
        } else {
          return reject(error);
        }
      });
    });
  }

  public async changePort(newPort: string): Promise<void> {
    if (newPort === this._currentPort) { return; }
    this._currentPort = newPort;
    if (!this.isActive) { return; }
    await this.close();
  }

  public async stop(): Promise<boolean> {
    if (!this.isActive) { return false; }

    await this.close();
    if (this._bufferedOutputChannel) {
      this._bufferedOutputChannel.appendLine(`[Done] Closed the serial port ${os.EOL}`);
    }

    return true;
  }

  public async changeBaudRate(newRate: number): Promise<void> {
    this._currentBaudRate = newRate;
    if (!this.isActive) { return; }
    await this.stop();
    await this.open();
  }

  public async changeTimestampFormat(newTimestampFormat: string): Promise<void> {
    this._currentTimestampFormat = newTimestampFormat;
  }

  private close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._port.close((err) => {
        if (err) {
          reject(err);
        } else {
          this._port = undefined;
          resolve();
        }
      })
    });
  }
}
