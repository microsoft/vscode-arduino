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

export function getBoardPackages() {
    return window.fetch("/api/boardpackages").then((response) => response.json());
}

export function installBoard(packageName, arch, version) {
    return postHTTP("/api/installboard", {
        packageName,
        arch,
        version,
    }).then((response) => response.json());
}

export function uninstallBoard(packagePath) {
    return postHTTP("/api/uninstallboard", {
        packagePath,
    }).then((response) => response.json());
}

export function openLink(link) {
    return postHTTP("/api/openlink", {
        link,
    }).then((response) => response.json());
}
