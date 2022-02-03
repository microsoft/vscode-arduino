// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { IHostPlatform } from "./i-host-platform";
import { DarwinPlatform } from "./sys/darwin";
import { LinuxPlatform } from "./sys/linux";
import { WindowsPlatform } from "./sys/win32";

export function hostPlatform(): IHostPlatform {
    switch(process.platform) {
        case 'win32':
            return new WindowsPlatform();
        case 'darwin':
            return new DarwinPlatform();
        case 'linux':
            return new LinuxPlatform();
        default:
            return new LinuxPlatform();
    }
}
