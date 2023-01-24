import * as assert from "assert";
import * as TypeMoq from "typemoq";
import * as vscode from "vscode";

import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";
import { Board } from "../src/arduino/board";
import { BoardManager } from "../src/arduino/boardManager";
import { IPlatform, IProgrammer } from "../src/arduino/package";
import { Programmer } from "../src/arduino/programmer";
import { ProgrammerManager } from "../src/arduino/programmerManager";
import { DeviceContext } from "../src/deviceContext";

suite("Arduino: Programmer Manager.", () => {
    let programmerManager: ProgrammerManager;
    let restoreSuppress: boolean;
    let programmers: IProgrammer[];

    setup((done) => {
        // Suppress saving the device context, as not to polute the test arduino.json file
        restoreSuppress = DeviceContext.getInstance().suppressSaveContext;
        DeviceContext.getInstance().suppressSaveContext = true;

        // Mock two different platforms
        const platformMock1 = TypeMoq.Mock.ofType<IPlatform>();
        platformMock1.setup((x) => x.packageName).returns(() => "mockplatform1");
        const platformMock2 = TypeMoq.Mock.ofType<IPlatform>();
        platformMock2.setup((x) => x.packageName).returns(() => "mockplatform2");

        // Mock a single selected board, using the the first mocked platform
        const mockedBoard = TypeMoq.Mock.ofType(Board);
        mockedBoard.setup((x) => x.platform).returns(() => platformMock1.object);

        // Setup a list of installed programmers
        programmers = [
            new Programmer("test1", platformMock1.object, "test1_display"),
            new Programmer("test2", platformMock1.object),
            new Programmer("test3", platformMock2.object)];

        const installedProgrammers = new Map<string, IProgrammer>();
        programmers.forEach((v) => installedProgrammers.set(v.name, v));

        // Mock the BoardManager with minimal set of required functionality
        const mockBoardManager = TypeMoq.Mock.ofType(BoardManager);
        mockBoardManager.setup((x) => x.currentBoard).returns(() => mockedBoard.object);
        mockBoardManager.setup((x) => x.installedProgrammers).returns(() => installedProgrammers);
        mockBoardManager.setup((x) => x.onBoardTypeChanged).returns(() => new vscode.EventEmitter<void>().event);

        // Mock minimal ArduinoApp
        const arduinoApp = TypeMoq.Mock.ofType(ArduinoApp);
        arduinoApp.setup((x) => x.boardManager).returns(() => mockBoardManager.object);

        try {
            programmerManager = new ProgrammerManager(TypeMoq.Mock.ofType(ArduinoSettings).object, arduinoApp.object);
            done();
        } catch (error) {
            done(`Failed to initialize ProgrammerManager: ${error}`);
        }
    });

    teardown(() => {
        // Restpre the supression state for the DeviceContext
        DeviceContext.getInstance().suppressSaveContext = restoreSuppress;
    });

    test("value stored in arduino.ino should load by default", () => {
        assert.equal(programmerManager.currentProgrammer, "arduino:jtag3isp");
        assert.equal(programmerManager.currentDisplayName, "arduino:jtag3isp");
    });

    test("changing arduino.ino value should change programmer", function(done) {
        this.timeout(3 * 60 * 1000);
        DeviceContext.getInstance().programmer = programmers[0].name;
        setTimeout(() => {
            assert.equal(programmerManager.currentProgrammer, programmers[0].key);
            assert.equal(programmerManager.currentDisplayName, programmers[0].displayName);
            done();
        }, 200);
    });

    test("changing arduino.ino value to null should clear displayname to not found value", (done) => {
        DeviceContext.getInstance().programmer = null;
        setTimeout(() => {
            assert.equal(programmerManager.currentProgrammer, null);
            assert.equal(programmerManager.currentDisplayName, ProgrammerManager.notFoundDisplayValue);
            done();
        }, 200);
    });

    test("changing arduino.ino value to an unknown value will be accepted, and will replicate value as displayname", (done) => {
        const unknownProgrammerValue = "unknown:programmer";

        DeviceContext.getInstance().programmer = unknownProgrammerValue;
        setTimeout(() => {
            assert.equal(programmerManager.currentProgrammer, unknownProgrammerValue);
            assert.equal(programmerManager.currentDisplayName, unknownProgrammerValue);
            done();
        }, 200);
    });
});
