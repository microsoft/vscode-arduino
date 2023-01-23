import * as assert from "assert";

import * as Path from "path";
import * as TypeMoq from "typemoq";

import * as Resources from "./resources";

import ArduinoContext from "..//src/arduinoContext";
import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";
import { BoardManager } from "../src/arduino/boardManager";
import { LibraryManager } from "../src/arduino/libraryManager";
import * as util from "../src/common/util";

suite("Arduino: Library Manager.", () => {

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to load libraries", function(done) {
        const arduinoSettings = TypeMoq.Mock.ofType(ArduinoSettings);
        arduinoSettings.setup((x) => x.packagePath).returns(() => Resources.mockedPackagePath);
        arduinoSettings.setup((x) => x.defaultLibPath).returns(() => Resources.mockedIDELibPath);
        arduinoSettings.setup((x) => x.sketchbookPath).returns(() => Resources.mockedSketchbookPath);

        const mockedBoardManager = TypeMoq.Mock.ofType(BoardManager);
        mockedBoardManager.setup((x) => x.getInstalledPlatforms()).returns(() => [{
            rootBoardPath: Path.join(Resources.mockedIDEPackagePath, "arduino", "avr"),
            architecture : "avr",
        }, {
            rootBoardPath: Path.join(Resources.mockedSketchbookPath, "hardware/esp8266/esp8266"),
            architecture: "esp8266",
            version: "2.2.0",
        }]);
        mockedBoardManager.setup((x) => x.currentBoard).returns(() => null);

        const arduinoApp = TypeMoq.Mock.ofType(ArduinoApp);
        arduinoApp.setup((x) => x.initializeLibrary(TypeMoq.It.isAny()));
        arduinoApp.setup((x) => x.boardManager).returns(() => mockedBoardManager.object);

        const libraryManager = new LibraryManager(arduinoSettings.object, arduinoApp.object);
        libraryManager.loadLibraries(false).then(() => {
            const libraries = libraryManager.libraries;
            assert.equal(libraries.length, 945, "Library Manager should display all libraries listed in library_index.json");

            const installedLibraries = libraries.filter((library) => {
                return !!library.installed;
            });
            // console.log(installedLibraries);
            assert.equal(installedLibraries.length, 4, "Library Manager should display installed libraries");
            assert.equal(installedLibraries[0].name, "Ethernet");
            assert.equal(installedLibraries[0].builtIn, true);
            assert.equal(installedLibraries[0].srcPath, Path.join(Resources.mockedIDELibPath, "Ethernet", "src"),
                "Should be able to find src path of install library");

            assert.equal(installedLibraries[1].name, "AzureIoTHub");
            assert.equal(installedLibraries[1].builtIn, false);
            assert.equal(installedLibraries[1].srcPath, Path.join(Resources.mockedSketchbookPath, "libraries", "AzureIoTHub", "src"));
            assert.equal(installedLibraries[1].version, "1.0.21");

            assert.equal(installedLibraries[2].name, "EEPROM");
            assert.equal(installedLibraries[3].name, "ArduinoOTA");

            done();
        }).catch((error) => {
            done(error);
        });
    });

    // Arduino: Library Manager: Install extenal libarary.
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to install libraries", function(done) {
        this.timeout(3 * 60 * 1000);
        try {
            // Library Manager: Install extenal libarary.
            ArduinoContext.arduinoApp.installLibrary("FastLED", "3.5.0", true).then((result) => {
                // check if the installation succeeds or not
                const arduinoSettings = ArduinoContext.arduinoApp.settings;
                const libPath = Path.join(arduinoSettings.sketchbookPath, "libraries", "FastLED");

                if (util.directoryExistsSync(libPath)) {
                    done();
                } else {
                    done(new Error("FastLED library install failure, can't find library path: " + libPath));
                }
            });

        } catch (error) {
            done(new Error(error));
        }
    });

    // Arduino: Library Manager: remove extenal libarary.
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to remove libraries", () => {
        try {
            // Library Manager: remove extenal libarary.
            const arduinoSettings = ArduinoContext.arduinoApp.settings;
            const libPath = Path.join(arduinoSettings.sketchbookPath, "libraries", "FastLED");

            if (util.directoryExistsSync(libPath)) {
                ArduinoContext.arduinoApp.uninstallLibrary("FastLED", libPath);
                assert.equal(util.directoryExistsSync(libPath), false,
                 "Library path still exist after calling uninstall library,remove the library failure");
            }

        } catch (error) {
            assert.fail(true, false, new Error(error).message, new Error(error).name);
        }
    });

});
