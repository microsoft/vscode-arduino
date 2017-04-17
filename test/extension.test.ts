//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino Extension Tests", () => {
    test("should be present", () => {
        assert.ok(vscode.extensions.getExtension("vsciot-vscode.vscode-arduino"));
    });

    // The extension is already activated by vscode before running mocha test framework.
    // No need to test activate any more. So commenting this case.
    // tslint:disable-next-line: only-arrow-functions
    // test("should be able to activate the extension", function(done) {
    //     this.timeout(3 * 60 * 1000);
    //     vscode.extensions.getExtension("vsciot-vscode.vscode-arduino").activate().then((api) => {
    //         done();
    //     });
    // });
});
