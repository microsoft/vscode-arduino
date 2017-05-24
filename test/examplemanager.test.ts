import * as assert from "assert";
import * as Path from "path";
import * as TypeMoq from "typemoq";

import * as Resources from "./resources";

import { ArduinoApp } from "../src/arduino/arduino";
import { ArduinoSettings } from "../src/arduino/arduinoSettings";
import { BoardManager } from "../src/arduino/boardManager";
import { ExampleManager } from "../src/arduino/exampleManager";

suite("Arduino: Example Manager.", () => {

    // tslint:disable-next-line: only-arrow-functions
    test("should be able to load examples", function(done) {
        const arduinoSettings = TypeMoq.Mock.ofType(ArduinoSettings);
        arduinoSettings.setup((x) => x.packagePath).returns(() => Resources.mockedPackagePath);
        arduinoSettings.setup((x) => x.defaultLibPath).returns(() => Resources.mockedIDELibPath);
        arduinoSettings.setup((x) => x.sketchbookPath).returns(() => Resources.mockedSketchbookPath);
        arduinoSettings.setup((x) => x.defaultExamplePath).returns(() => Resources.mockedIDEExamplesPath);

        const mockedBoardManager = TypeMoq.Mock.ofType(BoardManager);
        mockedBoardManager.setup((x) => x.currentBoard).returns(() => null);

        const arduinoApp = TypeMoq.Mock.ofType(ArduinoApp);
        arduinoApp.setup((x) => x.boardManager).returns(() => mockedBoardManager.object);

        const exampleManager = new ExampleManager(arduinoSettings.object, arduinoApp.object);
        exampleManager.loadExamples().then((examples) => {
            // console.log(examples);
            assert.equal(examples.length, 3);
            assert.equal(examples[0].name, "Built-in Examples", "Verify Built-in Examples");
            assert.equal(examples[0].children.length, 1);
            assert.equal(examples[0].children[0].name, "01.Basics");
            assert.equal(examples[0].children[0].children.length, 1);

            assert.equal(examples[1].name, "Examples for any board", "Verify Examples for any board");
            assert.equal(examples[1].children.length, 1);
            assert.equal(examples[1].children[0].name, "Ethernet");
            assert.equal(examples[1].children[0].children.length, 1);
            assert.equal(examples[1].children[0].children[0].name, "WebServer");
            assert.equal(examples[1].children[0].children[0].path, Path.join(Resources.mockedIDELibPath, "Ethernet", "examples", "WebServer"));

            assert.equal(examples[2].name, "Examples from Custom Libraries", "Verify Examples from Custom Libraries");
            assert.equal(examples[2].children.length, 1);
            assert.equal(examples[2].children[0].name, "AzureIoTHub");
            assert.equal(examples[2].children[0].children.length, 1);
            assert.equal(examples[2].children[0].children[0].name, "simplesample_http");
            assert.equal(examples[2].children[0].children[0].path,
                Path.join(Resources.mockedSketchbookPath, "libraries", "AzureIoTHub", "examples", "simplesample_http"));

            done();
        }).catch((error) => {
          done(error);
        });
    });

});
