//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino: Arduino Board Configuration", () => {
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino.showBoardConfig", function(done) {
        this.timeout(60 * 1000);
        try {
            // run "Arduino: Arduino Board Configuration" command.
            vscode.commands.executeCommand("arduino.showBoardConfig").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

});
