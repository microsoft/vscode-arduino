import * as mdns from "mdns-js";
import { hostname, networkInterfaces } from "os";

export interface IRemotePortDetail {
    ip: string;
    port?: string;
    host: string;
    name: string;
}

interface IMdnsData {
    addresses?: string[];
    query?: string[];
    port?: number;
    fullname?: string;
    txt?: string[];
    type: Array<{
        name: string,
        protocol: string,
        subtypes: string[],
        description?: string,
    }>;
    host?: string;
    interfaceIndex: number;
    networkInterface: string;
}

export class RemotePortCtrl {
    private ports: IRemotePortDetail[];

    constructor() {
        const browser = mdns.createBrowser("_arduino._tcp");
        mdns.excludeInterface("0.0.0.0");

        browser.on("ready", () => { browser.discover(); });
        browser.on("update", this.onUpdate.bind(this));
    }

    public listPorts(): IRemotePortDetail[] {
        return this.ports;
    }

    private onUpdate(mdsnData: IMdnsData): void {
        if (this.isArduino(mdsnData)) {
            this.ports = new Array();
            const sshUploadPort = mdsnData.txt.filter((value) => { value.includes("ssh_upload_port"); }).pop();
            const ports = mdsnData.addresses.map((address: string): IRemotePortDetail => {
                return {
                    ip: address,
                    port: sshUploadPort ? sshUploadPort.split("=")[1] : null,
                    host: mdsnData.host.replace(".local", ""),
                    name: mdsnData.fullname.replace("._arduino._tcp.local", ""),
                };
            });
            this.ports.push(...ports);
        }
    }

    private isArduino(data: IMdnsData) {
        return data.fullname && data.fullname.includes("arduino");
    }
}
