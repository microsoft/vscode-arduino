import * as assert from "assert";
import * as Path from "path";
import * as TypeMoq from "typemoq";

import * as Resources from "./resources";

import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";
import { BoardManager } from "../src/arduino/BoardManager";

suite("Arduino: Board Manager.", () => {

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to load board packages", function(done) {
        const arduinoSettings = TypeMoq.Mock.ofType(ArduinoSettings);
        arduinoSettings.setup((x) => x.preferences).returns(() => new Map<string, string>());
        arduinoSettings.setup((x) => x.packagePath).returns(() => Resources.mockedPackagePath);
        arduinoSettings.setup((x) => x.defaultPackagePath).returns(() => Resources.mockedIDEPackagePath);
        arduinoSettings.setup((x) => x.sketchbookPath).returns(() => Resources.mockedSketchbookPath);

        const arduinoApp = TypeMoq.Mock.ofType(ArduinoApp);
        arduinoApp.setup((x) => x.setPref(TypeMoq.It.isAny(), TypeMoq.It.isAny()));
        arduinoApp.setup((x) => x.initialize(TypeMoq.It.isAny()));
        arduinoApp.setup((x) => x.addLibPath(TypeMoq.It.isAny()));

        const boardManager = new BoardManager(arduinoSettings.object, arduinoApp.object);
        boardManager.loadPackages(false).then(() => {
            const platforms = boardManager.platforms;
            assert.equal(platforms.length, 14);
            assert.equal(platforms[0].name, "Arduino AVR Boards", "Board Manager should display built Arduino AVR Boards");
            assert.equal(platforms[0].installedVersion, "1.6.18", "Arduino IDE built-in AVR board package version should be 1.6.18");
            assert.equal(platforms[0].rootBoardPath, Path.join(Resources.mockedIDEPackagePath, "arduino", "avr"),
            "Should be able to index root board path for installed boards");

            const installedPlatforms = platforms.filter((platform) => {
                return !!platform.installedVersion;
            });
            assert.equal(installedPlatforms.length, 1, "Board Manager should display installed board packages.");

            assert.equal(boardManager.installedBoards.size, 26, "Arduino IDE should contains built-in AVR boards");
            assert.equal(boardManager.installedBoards.has("arduino:avr:yun"), true, "Arduino built-in packages should support yun");

            done();
        }).catch((error) => {
          done(error);
        });
    });

});
