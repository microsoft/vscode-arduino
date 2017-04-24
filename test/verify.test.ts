//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino: Verify: Build (verify) your sketch files.", () => {
    test("should be run command: Arduino verify", function(done) {
        this.timeout(3 * 60 * 1000);
        try {
            // Press Ctrl+ R to run "arduino:verify" command.
            vscode.commands.executeCommand("arduino.verify").then((result) => {
                vscode.window.showInformationMessage("verify sketch successfully");
            }).then(() => done());

        } catch (error) {
            done(new Error(error));
        }
    });

});
