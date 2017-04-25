//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as os from "os";
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
    //     const extension = vscode.extensions.getExtension("vsciot-vscode.vscode-arduino");
    //     if (!extension.isActive) {
    //         extension.activate().then((api) => {
    //             done();
    //         }, () => {
    //             done("Failed to activate extension");
    //         });
    //     }
    // });

    suiteTeardown(() => {
        // When running test on osx, the vscode instance is hanging there after tests finished and cause mocha timeout.
        // As a workaround, closing usb-detection process manually would make test window exit normally.
        if (os.platform() !== "linux") {
            const usbDector = require("../../vendor/node-usb-detection");
            usbDector.stopMonitoring();
        }
    });
});
