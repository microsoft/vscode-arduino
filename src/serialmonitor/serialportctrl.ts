// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SerialPort } from "serialport";

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
}
