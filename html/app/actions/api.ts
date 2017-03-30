/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

function postHTTP(url, postData) {
    const request = new Request(url, {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(postData),
    });
    return window.fetch(request);
}

export function getBoardPackages(update) {
    return window.fetch(`/api/boardpackages?update=${update}`).then((response) => response.json());
}

export function installBoard(packageName, arch, version) {
    return postHTTP("/api/installboard", {
        packageName,
        arch,
        version,
    }).then((response) => response.json());
}

export function uninstallBoard(boardName, packagePath) {
    return postHTTP("/api/uninstallboard", {
        boardName,
        packagePath,
    }).then((response) => response.json());
}

export function openLink(link) {
    return postHTTP("/api/openlink", {
        link,
    }).then((response) => response.json());
}

export function getLibraries(update) {
    return window.fetch(`/api/libraries?update=${update}`).then((response) => response.json());
}

export function installLibrary(libraryName, version) {
    return postHTTP("/api/installlibrary", {
        libraryName,
        version,
    }).then((response) => response.json());
}

export function uninstallLibrary(libraryName, libraryPath) {
    return postHTTP("/api/uninstalllibrary", {
        libraryName,
        libraryPath,
    }).then((response) => response.json());
}

export function addLibPath(libraryPath) {
    return postHTTP("/api/addlibpath", {
        libraryPath,
    }).then((response) => response.json());
}

export function getConfigItems() {
    return window.fetch(`/api/configitems`).then((response) => response.json());
}

export function updateConfigItem(configId, optionId) {
    return postHTTP("/api/updateconfig", {
        configId,
        optionId,
    }).then((response) => response.json());
}

export function getExamples() {
    return window.fetch("/api/examples").then((response) => response.json());
}

export function openExample(examplePath) {
    return postHTTP("/api/openexample", {
        examplePath,
    }).then((response) => response.json());
}
