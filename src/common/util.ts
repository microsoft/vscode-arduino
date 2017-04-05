/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as childProcess from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as properties from "properties";
import * as vscode from "vscode";

/**
 * This function will return the VSCode C/C++ extesnion compatible platform literals.
 * @function getCppConfigPlatform
 */
export function getCppConfigPlatform(): string {
    const plat = os.platform();
    if (plat === "linux") {
        return "Linux";
    } else if (plat === "darwin") {
        return "Mac";
    } else if (plat === "win32") {
        return "Win32";
    }
}

/**
 * This function will detect the file existing in the sync mode.
 * @function fileExistsSync
 * @argument {string} filePath
 */
export function fileExistsSync(filePath: string): boolean {
    try {
        return fs.statSync(filePath).isFile();
    } catch (e) {
        return false;
    }
}

/**
 * This function will detect the directoy existing in the sync mode.
 * @function directoryExistsSync
 * @argument {string} dirPath
 */
export function directoryExistsSync(dirPath: string): boolean {
    try {
        return fs.statSync(dirPath).isDirectory();
    } catch (e) {
        return false;
    }
}

/**
 * This function will implement the same function as the fs.readdirSync,
 * besides it could filter out folders only when the second argument is true.
 * @function readdirSync
 * @argument {string} dirPath
 * @argument {boolean} folderOnly
 */
export function readdirSync(dirPath: string, folderOnly: boolean = false): string[] {
    const dirs = fs.readdirSync(dirPath);
    if (folderOnly) {
        return dirs.filter((subdir) => {
            return directoryExistsSync(path.join(dirPath, subdir));
        });
    } else {
        return dirs;
    }
}

/**
 * Recursively create directories. Equals to "mkdir -p"
 * @function mkdirRecursivelySync
 * @argument {string} dirPath
 */
export function mkdirRecursivelySync(dirPath: string): void {
    if (directoryExistsSync(dirPath)) {
        return;
    }
    const dirname = path.dirname(dirPath);
    if (path.normalize(dirname) === path.normalize(dirPath)) {
        fs.mkdirSync(dirPath);
    } else if (directoryExistsSync(dirname)) {
        fs.mkdirSync(dirPath);
    } else {
        mkdirRecursivelySync(dirname);
        fs.mkdirSync(dirPath);
    }
}

/**
 * Recursively delete files. Equals to "rm -rf"
 * @function rmdirRecursivelySync
 * @argument {string} rootPath
 */
export function rmdirRecursivelySync(rootPath: string): void {
    if (fs.existsSync(rootPath)) {
        fs.readdirSync(rootPath).forEach((file) => {
            const curPath = path.join(rootPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                rmdirRecursivelySync(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(rootPath);
    }
}

function copyFileSync(src, dest, overwrite: boolean = true) {
    if (!fileExistsSync(src) || (!overwrite && fileExistsSync(dest))) {
        return;
    }
    const BUF_LENGTH = 64 * 1024;
    const buf = new Buffer(BUF_LENGTH);
    let lastBytes = BUF_LENGTH;
    let pos = 0;
    let srcFd = null;
    let destFd = null;

    try {
        srcFd = fs.openSync(src, "r");
    } catch (error) {
    }

    try {
        destFd = fs.openSync(dest, "w");
    } catch (error) {
    }

    try {
        while (lastBytes === BUF_LENGTH) {
            lastBytes = fs.readSync(srcFd, buf, 0, BUF_LENGTH, pos);
            fs.writeSync(destFd, buf, 0, lastBytes);
            pos += lastBytes;
        }
    } catch (error) {
    }

    if (srcFd) {
        fs.closeSync(srcFd);
    }
    if (destFd) {
        fs.closeSync(destFd);
    }
}

function copyFolderRecursivelySync(src, dest) {
    if (!directoryExistsSync(src)) {
        return;
    }
    if (!directoryExistsSync(dest)) {
        mkdirRecursivelySync(dest);
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
        const fullPath = path.join(src, item);
        const targetPath = path.join(dest, item);
        if (directoryExistsSync(fullPath)) {
            copyFolderRecursivelySync(fullPath, targetPath);
        } else if (fileExistsSync(fullPath)) {
            copyFileSync(fullPath, targetPath);
        }
    }
}

/**
 * Copy files & directories recursively. Equals to "cp -r"
 * @argument {string} src
 * @argument {string} dest
 */
export function cp(src, dest) {
    if (fileExistsSync(src)) {
        let targetFile = dest;
        if (directoryExistsSync(dest)) {
            targetFile = path.join(dest, path.basename(src));
        }
        if (path.relative(src, targetFile)) {
            // if the source and target file is the same, skip copying.
            return;
        }
        copyFileSync(src, targetFile);
    } else if (directoryExistsSync(src)) {
        copyFolderRecursivelySync(src, dest);
    } else {
        throw new Error(`No such file or directory: ${src}`);
    }
}

/**
 * Check if the specified file is an arduino file (*.ino, *.pde).
 * @argument {string} filePath
 */
export function isArduinoFile(filePath): boolean {
    return fileExistsSync(filePath) && (path.extname(filePath) === ".ino" || path.extname(filePath) === ".pde");
}

export function spawn(command: string, outputChannel: vscode.OutputChannel, args: string[] = [], options: any = {}): Thenable<object> {
    return new Promise((resolve, reject) => {
        const stdout = "";
        const stderr = "";
        options.cwd = options.cwd || path.resolve(path.join(__dirname, ".."));
        const child = childProcess.spawn(command, args, options);

        if (outputChannel) {
            child.stdout.on("data", (data) => { outputChannel.append(data.toString()); });
            child.stderr.on("data", (data) => { outputChannel.append(data.toString()); });
        }

        child.on("error", (error) => reject({ error, stderr, stdout }));

        child.on("exit", (code) => {
            if (code === 0) {
                resolve({ code, stdout, stderr });
            } else {
                reject({ code, stdout, stderr });
            }
        });
    });
}

export function tryParseJSON(jsonString: string) {
    try {
        const jsonObj = JSON.parse(jsonString);
        if (jsonObj && typeof jsonObj === "object") {
            return jsonObj;
        }
    } catch (ex) { }

    return false;
}

export function isJunk(filename: string): boolean {
    // tslint:disable-next-line
    const re = /^npm-debug\.log$|^\..*\.swp$|^\.DS_Store$|^\.AppleDouble$|^\.LSOverride$|^Icon\r$|^\._.*|^\.Spotlight-V100(?:$|\/)|\.Trashes|^__MACOSX$|~$|^Thumbs\.db$|^ehthumbs\.db$|^Desktop\.ini$/;
    return re.test(filename);
}

export function filterJunk(files: any[]): any[] {
    return files.filter((file) => !isJunk(file));
}

export function parseProperties(propertiesFile: string): Thenable<object> {
    return new Promise((resolve, reject) => {
        properties.parse(propertiesFile, { path: true }, (error, obj) => {
            if (error) {
                reject(error);
            } else {
                resolve(obj);
            }
        });
    });
}

export function formatVersion(version: string): string {
    if (!version) {
        return version;
    }
    const versions = String(version).split(".");
    if (versions.length < 2) {
        versions.push("0");
    }
    if (versions.length < 3) {
        versions.push("0");
    }
    return versions.join(".");
}

export function union(a: any[], b: any[], compare?: (item1, item2) => boolean) {
    const result = [].concat(a);
    b.forEach((item) => {
        const exist = result.find((element) => {
            return (compare ? compare(item, element) : Object.is(item, element));
        });
        if (!exist) {
            result.push(item);
        }
    });
    return result;
}
