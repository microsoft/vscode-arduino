import *  as mdns from "mdns-js";
import { hostname, networkInterfaces } from "os";

export interface RemotePortDetail {
    ip: string;
    port?: string;
    host: string;
    name: string;
}

interface mDNSData {
    addresses?: string[],
    query?: string[],
    port?: number,
    fullname?: string,
    txt?: string[],
    type: {
        name: string,
        protocol: string,
        subtypes: string[],
        description?: string,
    }[],
    host?: string,
    interfaceIndex: number,
    networkInterface: string,
}

export class RemotePortCtrl {
    private ports: RemotePortDetail[];

    constructor() {
        const browser = mdns.createBrowser('_arduino._tcp');
        mdns.excludeInterface('0.0.0.0');

        browser.on('ready', () => { browser.discover() });
        browser.on('update', this.onUpdate.bind(this));
    }

    public listPorts(): RemotePortDetail[] {
        return this.ports;
    }

    private onUpdate(mDNSData: mDNSData): void {
        if (this.isArduino(mDNSData)) {
            this.ports = new Array(); 
            const sshUploadPort = mDNSData.txt.filter(value => value.includes('ssh_upload_port')).pop();
            const ports = mDNSData.addresses.map((address: string): RemotePortDetail => {
                
                return {
                    ip: address,
                    port: sshUploadPort ? sshUploadPort.split("=")[1] : null,
                    host: mDNSData.host.replace('.local', ''),
                    name: mDNSData.fullname.replace('._arduino._tcp.local', ''),
                };
            });
            this.ports.push(...ports);
        }
    }

    private isArduino(data: mDNSData) {
        return data.fullname && data.fullname.includes('arduino');
    }
}
