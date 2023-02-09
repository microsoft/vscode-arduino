//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as os from "os";
import * as vscode from "vscode";
const impor = require("impor")(__dirname);
const usbDetectorModule = impor("../src/serialmonitor/usbDetector") as typeof import ("../src/serialmonitor/usbDetector");

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino: Extension Tests", () => {
    test("should be present", () => {
        assert.ok(vscode.extensions.getExtension("vsciot-vscode.vscode-arduino"));
    });

    // The extension is already activated by vscode before running mocha test framework.
    // No need to test activate any more. So commenting this case.
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to activate the extension", function(done) {
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

    test("should be able to register arduino commands", () => {
            return vscode.commands.getCommands(true).then((commands) => {
                const ARDUINO_COMMANDS = [
                    "arduino.verify",
                    "arduino.upload",
                    "arduino.uploadUsingProgrammer",
                    "arduino.rebuildIntelliSenseConfig",
                    "arduino.selectProgrammer",
                    "arduino.showBoardManager",
                    "arduino.showLibraryManager",
                    "arduino.showBoardConfig",
                    "arduino.showExamples",
                    "arduino.changeBoardType",
                    "arduino.initialize",
                    "arduino.selectSerialPort",
                    "arduino.openSerialMonitor",
                    "arduino.changeTimestampFormat",
                    "arduino.closeSerialMonitor",
                    "arduino.reloadExample",
                    "arduino.showExampleExplorer",
                    "arduino.loadPackages",
                    "arduino.installBoard",
                    "arduino.selectSketch",
                    "arduino.cliUpload",
                    "arduino.cliUploadUsingProgrammer",
                ];

                const foundArduinoCommands = commands.filter((value) => {
                    return ARDUINO_COMMANDS.indexOf(value) >= 0 || value.startsWith("arduino.");
                });

                const errorMsg = "Some Arduino commands are not registered properly or a new command is not added to the test";
                assert.equal(foundArduinoCommands.length, ARDUINO_COMMANDS.length, errorMsg);
            });
        });

    suiteTeardown(() => {
        // When running test on osx or windows, the vscode instance is hanging there after tests finished and cause mocha timeout.
        // As a workaround, closing usb-detection process manually would make test window exit normally.
        if (os.platform() !== "linux") {
            usbDetectorModule.UsbDetector.getInstance().stopListening();
        }
    });
});
