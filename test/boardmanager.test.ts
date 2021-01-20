import * as assert from "assert";
import * as fs from "fs";

import * as Path from "path";
import * as TypeMoq from "typemoq";

import * as Resources from "./resources";

import ArduinoContext from "..//src/arduinoContext";
import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";
import { parseBoardDescriptor } from "../src/arduino/board";
import { BoardManager } from "../src/arduino/boardManager";
import { IPlatform } from "../src/arduino/package";
import { parseProgrammerDescriptor } from "../src/arduino/programmer";
import * as util from "../src/common/util";

suite("Arduino: Board Manager.", () => {
    let boardManager;

    // tslint:disable-next-line: only-arrow-functions
    setup(function(done) {
        const arduinoSettings = TypeMoq.Mock.ofType(ArduinoSettings);
        arduinoSettings.setup((x) => x.preferences).returns(() => new Map<string, string>());
        arduinoSettings.setup((x) => x.packagePath).returns(() => Resources.mockedPackagePath);
        arduinoSettings.setup((x) => x.defaultPackagePath).returns(() => Resources.mockedIDEPackagePath);
        arduinoSettings.setup((x) => x.sketchbookPath).returns(() => Resources.mockedSketchbookPath);

        const arduinoApp = TypeMoq.Mock.ofType(ArduinoApp);
        arduinoApp.setup((x) => x.setPref(TypeMoq.It.isAny(), TypeMoq.It.isAny()));
        arduinoApp.setup((x) => x.initialize(TypeMoq.It.isAny()));

        try {
            boardManager = new BoardManager(arduinoSettings.object, arduinoApp.object);
            boardManager.loadPackages(false).then(() => {
                done();
            }).catch((error) => {
                done(`Failed to load board manager packages: ${error}`);
            });
        } catch (error) {
            done(`Failed to load board manager packages: ${error}`);
        }
    });

    test("should be able to load packages", () => {
        const platforms = boardManager.platforms;
        assert.equal(platforms.length, 14);
        assert.equal(platforms[0].name, "Arduino AVR Boards", "Board Manager should display built Arduino AVR Boards");
        assert.equal(platforms[0].installedVersion, "1.6.18", "Arduino IDE built-in AVR board package version should be 1.6.18");
        assert.equal(platforms[0].rootBoardPath, Path.join(Resources.mockedIDEPackagePath, "arduino", "avr"),
            "Should be able to index root board path for installed boards");
    });

    test("should be able to load installed platforms", () => {
        const installedPlatforms = boardManager.platforms.filter((platform) => {
            return !!platform.installedVersion;
        });
        assert.equal(installedPlatforms.length, 1, "should display installed platforms via board manager.");

        const totalInstalledPlatforms = boardManager.getInstalledPlatforms();
        assert.equal(totalInstalledPlatforms.length, 2, "should parse installed platforms from board manager and manaually downloaded packages");
    });

    test("should be able to load installed boards", () => {
        assert.equal(boardManager.installedBoards.size, 46, "Arduino IDE should contains built-in AVR boards");
        assert.equal(boardManager.installedBoards.has("arduino:avr:yun"), true, "should parse installed boards from Arduino IDE built-in packages");
        assert.equal(boardManager.installedBoards.has("esp8266:esp8266:huzzah"), true,
            "should parse installed boards from custom packages ($sketchbook/hardware directory)");
    });

    test("should be able to load installed programmers", () => {
        assert.equal(boardManager.installedProgrammers.size, 17, `Expected to find programmers for dummy & AVR boards`);
        assert.ok(boardManager.installedProgrammers.get("avrispmkii"),
            "should parse installed programmers from Arduino IDE built-in packages");
        assert.ok(boardManager.installedProgrammers.get("esp8266_dummy"),
            "should parse installed programmers from custom packages ($sketchbook/hardware directory)");
    });

    test("should parse boards.txt correctly", () => {
        const arduinoAvrBoard = fs.readFileSync(Path.join(Resources.mockedIDEPackagePath, "arduino/avr/boards.txt"), "utf8");
        const platform = {
            name: "Arduino AVR Boards",
            architecture: "avr",
            package: {
                name: "arduino",
            },
        };
        const boardDescriptor = parseBoardDescriptor(arduinoAvrBoard, <IPlatform> platform);

        const yunBoard = boardDescriptor.get("yun");
        assert.equal(yunBoard.name, "Arduino Yún");
        assert.equal(yunBoard.getBuildConfig(), "arduino:avr:yun");
        assert.equal(yunBoard.configItems.length, 0);

        const diecimilaBoard = boardDescriptor.get("diecimila");
        assert.equal(diecimilaBoard.name, "Arduino Duemilanove or Diecimila");
        assert.equal(diecimilaBoard.configItems.length, 1, "should parse config items from boards.txt correctly");
        assert.equal(diecimilaBoard.configItems[0].displayName, "Processor");
        assert.equal(diecimilaBoard.configItems[0].selectedOption, "atmega328");
        assert.equal(diecimilaBoard.configItems[0].options.length, 2);
        assert.equal(diecimilaBoard.customConfig, "cpu=atmega328");
    });

    test("should parse programmers.txt correctly", () => {
        const arduinoAvrBoard = fs.readFileSync(Path.join(Resources.mockedIDEPackagePath, "arduino/avr/programmers.txt"), "utf8");
        const platform = {
            name: "Arduino AVR Boards",
            architecture: "avr",
            package: {
                name: "arduino",
            },
        };
        const programmerDescriptors = parseProgrammerDescriptor(arduinoAvrBoard, <IPlatform> platform);

        const avrispmkii = programmerDescriptors.get("avrispmkii");
        assert.equal(avrispmkii.name, "avrispmkii");
        assert.equal(avrispmkii.displayName, "AVRISP mkII");

        const usbGemma = programmerDescriptors.get("usbGemma");
        assert.equal(usbGemma.name, "usbGemma");
        assert.equal(usbGemma.displayName, "Arduino Gemma");
    });

    test("should parse platform.txt correctly", () => {
        const platformConfig = util.parseConfigFile(Path.join(Resources.mockedSketchbookPath, "hardware/esp8266/esp8266/platform.txt"));
        assert.equal(platformConfig.get("name"), "ESP8266 Modules");
        assert.equal(platformConfig.get("version"), "2.2.0");
    });

    // Arduino: Board Manager: Manage packages for boards.
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to install boards packages", function(done) {
        this.timeout(4 * 60 * 1000);
        try {
            // Board Manager: install boards packages.
            ArduinoContext.arduinoApp.installBoard("Microsoft", "win10", "1.1.2", true).then((result) => {
                const arduinoSettings = ArduinoContext.arduinoApp.settings;
                const packagePath = Path.join(arduinoSettings.packagePath, "packages", "Microsoft");
                // check if the installation succeeds or not
                if (util.directoryExistsSync(packagePath)) {
                    done();
                } else {
                    done(new Error("Microsoft board package install failure, can't find package path :" + packagePath));
                }
            });

        } catch (error) {
            done(new Error(error));
        }
    });

    // Arduino: Board Manager: remove boards packages.
    // tslint:disable-next-line: only-arrow-functions
    test("should be able to remove boards packages", () => {
        try {
            // Board Manager: remove boards packages.
            const arduinoSettings = ArduinoContext.arduinoApp.settings;
            const packagePath = Path.join(arduinoSettings.packagePath, "packages", "Microsoft");
            if (util.directoryExistsSync(packagePath)) {
                ArduinoContext.arduinoApp.uninstallBoard("Microsoft", packagePath);
                assert.equal(util.directoryExistsSync(packagePath), false,
                 "Package path still exist after calling uninstall package,remove the board package failure");
            }
        } catch (error) {
            assert.fail(true, false, new Error(error).message, new Error(error).name);
        }
    });

});
