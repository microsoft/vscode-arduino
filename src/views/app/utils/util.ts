// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export function parseGroups(sourceArray: any[], key): any[] {
    const groups = {};
    sourceArray.forEach((item) => {
        let groupName = null;
        if (key instanceof Function) {
            groupName = key(item);
        } else {
            groupName = item[key];
        }
        groupName = [].concat(groupName);
        for (const group of groupName) {
            if (group && !groups[group]) {
                groups[group] = true;
            }
        }
    });
    return Object.keys(groups);
}

export function versionCompare(a, b) {
    return versionArrayCompare(a.split("."), b.split("."));
}

function versionArrayCompare(a: any[], b: any[]) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const na = parseInt(a[i], 10);
        const nb = parseInt(b[i], 10);
        if (!isNaN(na) && !isNaN(nb)) {
            if (na > nb) {
                return 1;
            } else if (nb > na) {
                return -1;
            }
            const compare = (isNaN(a[i]) ? -1 : 1) - (isNaN(b[i]) ? -1 : 1);
            if (compare !== 0) {
                return compare;
            }
        } else if (!isNaN(na) && isNaN(nb)) {
            return 1;
        } else if (isNaN(na) && !isNaN(nb)) {
            return -1;
        } else {
            const re = /\-|\+/;
            const subA = a[i].split(re);
            const subB = b[i].split(re);
            if (subA.length > 1 || subB.length > 1 || subA[0] !== a[i] || subB[0] !== b[i]) {
                const compare = versionArrayCompare(subA, subB);
                if (compare !== 0) {
                    return compare;
                }
            }
        }
    }
    return a.length - b.length;
}

export function shallowEqual(objA, objB, keys?: any[]) {
    if (Object.is(objA, objB)) {
        return true;
    }

    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
    }

    let keysA = Object.keys(objA);
    if (keys) {
        keysA = keys;
    } else {
        const keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) {
            return false;
        }
    }

    // Test for A's keys different from B.
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is(objA[key], objB[key])) {
            return false;
        }
    }

    return true;
}
