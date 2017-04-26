//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino: Verify: Build (verify) your sketch files.", () => {
    test("should be run command: Arduino verify", (done) => {
        try {
            // Press ctrl+alt+r to run "arduino:verify" command.
            vscode.commands.executeCommand("arduino.verify").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    }).timeout(3 * 60 * 1000);

});
