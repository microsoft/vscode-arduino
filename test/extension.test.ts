//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino Extension Tests", () => {

    test("Verify command", (done) => {
        vscode.commands.executeCommand("extension.verifyArduino")
            .then((result) => assert(result === "verify", "Failed to verify Arduino app"))
            .then(done, done);
    });

    test("Upload Arduino command", (done) => {
        vscode.commands.executeCommand("extension.uploadArduino")
            .then((result) => assert(result === "upload", "Failed to upload arduino app"))
            .then(done, done);
    });
});
