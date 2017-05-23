import * as assert from "assert";
import * as Path from "path";
import * as TypeMoq from "typemoq";
import * as util from "../src/common/util";

import * as Resources from "./resources";

import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";

suite("Arduino: App Initialization", () => {
    const arduinoSettings = new ArduinoSettings();
    const arduinoApp = new ArduinoApp(arduinoSettings);

    // tslint:disable-next-line: only-arrow-functions
    setup(function(done) {
        try {
            arduinoSettings.initialize().then(() => {
                done();
            }).catch((error) => {
                done(`Failed to init arduino settings: ${error}`);
            });
        } catch (error) {
            done(`Failed to init arduino settings: ${error}` );
        }
    });

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to resolve arduino settings correctly", function(done) {
        assert.equal(util.directoryExistsSync(arduinoSettings.arduinoPath), true,
        "should resolve arduino installation directory automatically");

        assert.equal(util.fileExistsSync(arduinoSettings.commandPath), true,
        "should resolve arduino executable correctly");

        assert.equal(util.directoryExistsSync(arduinoSettings.defaultPackagePath), true,
        "should resolve arduino IDE built-in package directory correctly");

        assert.equal(util.directoryExistsSync(arduinoSettings.defaultLibPath), true,
        "should resolve arduino IDE built-in library directory correctly");

        assert.equal(util.directoryExistsSync(arduinoSettings.defaultExamplePath), true,
        "should resolve arduino IDE built-in example directory correctly");

        assert.equal(util.directoryExistsSync(arduinoSettings.packagePath), true,
        "should resolve user installed package directory correctly");

        done();
    });

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to download necessary package_index and preferences.txt", function(done) {
        try {
            arduinoApp.initialize(false).then(() => {
                assert.equal(util.fileExistsSync(arduinoSettings.preferencePath), true,
                "should be able to init preferences.txt file if not found");

                assert.equal(arduinoSettings.preferences.get("sketchbook.path"), arduinoSettings.sketchbookPath);

                assert.equal(util.fileExistsSync(Path.join(arduinoSettings.packagePath, "package_index.json")), true,
                "should be able to download package_index.json file if not found");

                done();
            }).catch((error) => {
                done(`Failed to init arduino app: ${error}`);
            });
        } catch (error) {
            done(`Failed to init arduino app: ${error}`);
        }
    });

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to download necessary library_index", function(done) {
        try {
            arduinoApp.initializeLibrary(false).then(() => {
                assert.equal(util.fileExistsSync(Path.join(arduinoSettings.packagePath, "library_index.json")), true,
                "should be able to download library_index.json file if not found");

                done();
            }).catch((error) => {
                done(`Failed to init library_index: ${error}`);
            });
        } catch (error) {
            done(`Failed to init library_index: ${error}`);
        }
    });
});
