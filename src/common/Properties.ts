import * as fs from 'fs';
import * as os from "os";

export class Properties {
    static max_deep = 10;
    private _map: Map<string, string>;

    constructor() {
        this._map = new Map<string, string>();
    }

    loadFile(file: string) {
        let osPostfix: string;
        const platform = os.platform();
        if (platform === "win32") {
            osPostfix = "windows";
        } else if (platform === "linux") {
            osPostfix = "linux";
        } else if (platform === "darwin") {
            osPostfix = "macosx"
        }
        const content = fs.readFileSync(file).toString();

        // unify newline
        content.replace(/\r\n/g, '\n');
        content.replace(/\r/g, '\n');

        const lines = content.split('\n');
        lines.forEach(l => {
            const line = l.trim();
            if (line.length > 0 && line[0] !== '#') {
                const pos = line.indexOf('=');
                const key = line.substr(0, pos).trim();
                key.replace('.' + osPostfix, '');
                const value = line.substr(pos + 1).trim();
                this._map.set(key, value);
            }
        });
    }

    private _get(key: string, deep: number): string | null {
        if (deep > Properties.max_deep || !(this._map.has(key)))
            return null;
        
        let isKey = false;
        let k = '';
        let res = '';
        const value = this._map.get(key);
        for (let i = 0; i < value.length; ++i) {
            if (value[i] === '{') {
                isKey = true;
                k = '';
            } else if (value[i] === '}') {
                let ctx = key.split('.');
                let v: string | null = null;
                while (ctx.length > 0) {
                    ctx.pop();
                    const new_key = ctx.slice();
                    new_key.push(k);
                    v = this._get(new_key.join('.'), deep + 1);
                    if (v !== null)
                        break;
                }
                if (v === null)
                    return null;
                res += v;
                isKey = false;
            } else if (isKey) {
                k += value[i];
            } else {
                res += value[i];
            }
        }
        return res;
    }

    get(key: string): string | null {
        return this._get(key, 0);
    }

    set(key: string, value: string): void {
        this._map.set(key, value);
    }

    extractWithPrefix(prefix: string): Properties {
        const res = new Properties();
        for (let [key, value] of this._map) {
            const path = key.split('.');
            if (path.length > 1 && path[0] === prefix) {
                res.set(path.slice(1).join('.'), value);
            }
        }
        return res;
    }

    merge(other: Properties): void {
        for (let [key, value] of other._map) {
            this.set(key, value);
        }
    }
}