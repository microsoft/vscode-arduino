import * as path from "path";
import * as Uuid from "uuid/v4";
import * as vscode from "vscode";
import * as fs from "fs-plus";

import { DeviceContext } from "./deviceContext";

export class iotStudioInitializer {
    public async Initialize(device: string) {
        let sketchRootPath = path.join(vscode.workspace.rootPath, device);
        if(sketchRootPath === '' || !fs.isDirectorySync(sketchRootPath))
        {
            vscode.window
            .showInformationMessage(
                'The sketch root folder provided is not correct.');
            return;
        }

        const deviceContext = DeviceContext.getInstance();
        deviceContext.resetContext(device);
        await deviceContext.loadContext();
    }
}