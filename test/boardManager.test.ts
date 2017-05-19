//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino: Boards Manager: Manage packages for boards", () => {
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino.showBoardManager", function(done) {
        this.timeout(3 * 60 * 1000);
        try {
            // run "Arduino: Boards Manager" command.
            vscode.commands.executeCommand("arduino.showBoardManager").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

});
