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
