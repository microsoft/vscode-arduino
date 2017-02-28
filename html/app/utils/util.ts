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
    return versionArrayCompare(a.split("."), b.split("."));
}

function versionArrayCompare(a: any[], b: any[]) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const na = Number(a[i]);
        const nb = Number(b[i]);
        if (!isNaN(na) && !isNaN(nb)) {
            if (na > nb) {
                return 1;
            } else if (nb > na) {
                return -1;
            }
        } else if (!isNaN(na) && isNaN(nb)) {
            return 1;
        } else if (isNaN(na) && !isNaN(nb)) {
            return -1;
        } else {
            const re = /\-|\+/;
            const compare = versionArrayCompare(a[i].split(re), b[i].split(re));
            if (compare !== 0) {
                return compare;
            }
        }
    }
    return a.length - b.length;
}
