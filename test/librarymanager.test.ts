import * as assert from "assert";
import * as Path from "path";
import * as TypeMoq from "typemoq";

import * as Resources from "./resources";

import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";
import { BoardManager } from "../src/arduino/boardManager";
import { LibraryManager } from "../src/arduino/libraryManager";

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
        }]);
        mockedBoardManager.setup((x) => x.currentBoard).returns(() => null);

        const arduinoApp = TypeMoq.Mock.ofType(ArduinoApp);
        arduinoApp.setup((x) => x.initializeLibrary(TypeMoq.It.isAny()));
        arduinoApp.setup((x) => x.boardManager).returns(() => mockedBoardManager.object);

        const libraryManager = new LibraryManager(arduinoSettings.object, arduinoApp.object);
        libraryManager.loadLibraries(false).then(() => {
            const libraries = libraryManager.libraries;
            assert.equal(libraries.length, 944, "Library Manager should display all libraries listed in library_index.json");

            const installedLibraries = libraries.filter((library) => {
                return !!library.installed;
            });
            // console.log(installedLibraries);
            assert.equal(installedLibraries.length, 2, "Library Manager should display installed libraries");
            assert.equal(installedLibraries[0].name, "Ethernet");
            assert.equal(installedLibraries[0].builtIn, true);
            assert.equal(installedLibraries[0].srcPath, Path.join(Resources.mockedIDELibPath, "Ethernet", "src"),
            "Should be able to find src path of install library");
            assert.equal(installedLibraries[1].name, "EEPROM");

            done();
        }).catch((error) => {
          done(error);
        });
    });

});
