// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Usage
//   $ node checkHash.js myfile.zip c704...3945
// Returns with an exit code of zero if and only if the SHA-256 hash of the
// given file matches the expected hash.

const path = process.argv[2];
const expected = process.argv[3];
const data = require('fs').readFileSync(path);
const hash = require('crypto').createHash('sha256').update(data).digest('hex');
if (hash !== expected) {
    console.error(
        `Expected SHA-256 of "${path}" to be ${expected} but found ${hash}.`);
    process.exit(1);
}
