# Arduino for Visual Studio Code

Welcome to **Arduino** for Visual Studio Code! The Arduino extension makes it easy to code, build and deploy your Arduino sketches in Visual Studio Code.

* Verify and upload your Arduino sketches in Visual Studio Code.
* Built-in Arduino board and library manager.
* IntelliSense support and syntax highlighting.
* Built-in serial port monitoring tool.
* Arduino example list.
* Snippets for ino files.
* F5 integration with debugging support (Arduino Zero).
* Commond Palette(F1) integration for most common Arduino commands (e.g. Verify, Upload).
* Customizable extension options including command shortcuts and more.

## Requirement

### Arduino
- [Arduino](https://www.arduino.cc/)

Currently, the extension relies on the Arduino IDE. You should properly install the Arduino IDE and configurate the installation path.

- If the arduino command is already available from shell, the extension will try to probe the installation folder.
- And you can specify the Arduino installation path in the VSCode user setting files:

    ``` json
    {
        "arduino.path": "D:\\Develop\\arduino",
    }
    ```

## Commands

## Settings

## Device Options

```json
{
    "board": ""
}
```

