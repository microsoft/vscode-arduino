//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("vscode-arduino extension commands test", () => {
    // tslint:disable-next-line: only-arrow-functions
    setup(function(done) {
        // Ensure that extension is activate while testing
       this.timeout(60 * 1000);
       const extension = vscode.extensions.getExtension("vsciot-vscode.vscode-arduino");
       if (!extension.isActive) {
            extension.activate().then((api) => {
                done();
            }, () => {
                done("Failed to activate extension");
            });
        } else {
            done();
        }
    });

    // Arduino: Boards Manager : Manage packages for boards
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino.showBoardManager", function(done) {
        this.timeout(60 * 1000);
        try {
            // run "Arduino: Boards Manager" command.
            vscode.commands.executeCommand("arduino.showBoardManager").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

    // Arduino: Libraries Manager: Explore and manage libraries
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino.showLibraryManager", function(done) {
        this.timeout(10 * 1000);
        try {
            // run "Arduino: Libraries Manager" command.
            vscode.commands.executeCommand("arduino.showLibraryManager").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

    // Arduino: Arduino Board Configuration
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino.showBoardConfig", function(done) {
        this.timeout(10 * 1000);
        try {
            // run "Arduino: Arduino Board Configuration" command.
            vscode.commands.executeCommand("arduino.showBoardConfig").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

    // Arduino: Examples: Show example list
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to run command: arduino.showExamples", function(done) {
        this.timeout(10 * 1000);
        try {
            // run "Arduino: Examples" command.
            vscode.commands.executeCommand("arduino.showExamples").then((result)  => {
                done();
            });

        } catch (error) {
            done(new Error(error));
        }
    });

});
