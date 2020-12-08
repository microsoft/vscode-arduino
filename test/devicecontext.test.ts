import * as assert from "assert";
import * as Path from "path";
import * as util from "../src/common/util";

import { DeviceContext } from "../src/deviceContext";

suite("Arduino: Device Context config", () => {

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to resolve arduino.json correctly", function(done) {
        const deviceContext = DeviceContext.getInstance();
        try {
            deviceContext.loadContext().then(() => {
                assert.equal(deviceContext.board, "arduino:avr:diecimila");
                assert.equal(deviceContext.port, "COM4");
                assert.equal(deviceContext.sketch, "blink.ino");
                assert.equal(deviceContext.configuration, "cpu=atmega328");
                assert.equal(deviceContext.output, null);
                assert.equal(deviceContext.debugger_, null);
                assert.equal(deviceContext.programmer, "jtag3isp");
                done();
            });
        } catch (error) {
            done(`Failed to load device context: ${error}`);
        }
    });
});
