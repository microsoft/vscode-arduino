// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// This file should work in both VS Code and browser contexts.

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
            const re = /-|\+/;
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
