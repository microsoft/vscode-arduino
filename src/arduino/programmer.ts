// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IPlatform, IProgrammer } from "./package";

export function parseProgrammerDescriptor(programmerDescriptor: string, plat: IPlatform): Map<string, IProgrammer> {
    const progrmmerLineRegex = /([^.]+)\.(\S+)=(.+)/;

    const result = new Map<string, IProgrammer>();
    const lines = programmerDescriptor.split(/[\r|\r\n|\n]/);

    lines.forEach((line) => {
        // Ignore comments.
        if (line.startsWith("#")) {
            return;
        }

        const match = progrmmerLineRegex.exec(line);
        if (match && match.length > 3) {
            let programmer = result.get(match[1]);
            if (!programmer) {
                programmer = new Programmer(match[1], plat);
                result.set(programmer.name
                    , programmer);
            }
            if (match[2] === "name") {
                programmer.displayName = match[3].trim();
            }
        }
    });
    return result;
}

export class Programmer implements IProgrammer {
    constructor(private _name: string,
                private _platform: IPlatform,
                private _displayName: string = _name) {
    }

    public get name(): string {
        return this._name;
    }

    public get platform(): IPlatform {
        return this._platform;
    }

    public get displayName(): string {
        return this._displayName;
    }

    public set displayName(value: string) {
        this._displayName = value;
    }

    /**
     * @returns {string} Return programmer key in format packageName:name
     */
    public get key() {
        return `${this.getPackageName}:${this.name}`;
    }

    private get getPackageName(): string {
        return this.platform.packageName ? this.platform.packageName : this.platform.package.name;
    }
}
