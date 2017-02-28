/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

export function groupBy(sourceArray: any[], key) {
    return sourceArray.reduce((result, item) => {
        (result[item[key]] = result[item[key]] || []).push(item);
        return result;
    }, {});
}

export function versionCompare(a, b) {
    const pa = a.split(".");
    const pb = b.split(".");
    for (let i = 0; i < 3; i++) {
        const na = Number(pa[i]);
        const nb = Number(pb[i]);
        if (na > nb) {
            return 1;
        }
        if (nb > na) {
            return -1;
        }
        if (!isNaN(na) && isNaN(nb)) {
            return 1;
        }
        if (isNaN(na) && !isNaN(nb)) {
            return -1;
        }
        if (isNaN(na) && isNaN(nb)) {
            const re = /\-|\+/;
            return versionArrayCompare(pa[i].split(re), pb[i].split(re));
        }
    }
    return 0;
}

function versionArrayCompare(a: any[], b: any[]) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const na = Number(a[i]);
        const nb = Number(b[i]);
        if (na > nb) {
            return 1;
        }
        if (nb > na) {
            return -1;
        }
        if (!isNaN(na) && isNaN(nb)) {
            return 1;
        }
        if (isNaN(na) && !isNaN(nb)) {
            return -1;
        }
    }
    if (a.length === b.length) {
        return 0;
    } else {
        return a.length > b.length ? 1 : -1;
    }
}
