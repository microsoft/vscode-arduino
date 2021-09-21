//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino: Verify: Build (verify) your sketch files.", () => {
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino verify", function(done) {
        this.timeout(3 * 60 * 1000);
        try {
            // Press ctrl+alt+r to run "arduino:verify" command.
            vscode.commands.executeCommand("arduino.verify").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

});
