# Arduino for Visual Studio Code

Welcome to **Arduino** for Visual Studio Code! The Arduino extension makes it easy to code, build and deploy your Arduino sketches in Visual Studio Code.

* Verify and upload your Arduino sketches in Visual Studio Code.
* Built-in Arduino board and library manager.
* IntelliSense support and syntax highlighting.
* Built-in serial port monitoring tool.
* Snippets for \*.ino files.
* Commond Palette(F1) integration for most common Arduino commands (e.g. Verify, Upload...).
* TBD: Arduino example list.
* TBD: Customizable extension options including command shortcuts and more.
* TBD: F5 integration with debugging support (Arduino Zero).

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
This extension provides several commands in the Command Palette (F1) for working with `*.ino` files:
- **Arduino: Add library path**: Init the config file, which contains platform related configurations.
- **Arduino: Verify**: Build (verify) your sketch (\*.ino) file.
- **Arduino: Upload**: Build your sketch file and deploy (upload) to your Arduino board via serial port.
- **Arduino: Open Serial Monitoring**: Open serial monotoring tool in the intergrated output window.
- **Arduino: Send Text to Serial Port**: Send a line of text via the specified serial port.
- **Arduino: Stop Serial Monitor**: Stop serial monitoring tool and release the occupied serial port.
- **Arduino: Boards Manager**: Manage development platforms for additional boards.
- **Arduino: Manage Libraries**: Show a list of libraries that are already installed or ready for installation.
- **Arduino: Change Baud Rate**: Change the band rate of current serial port communication.
- **Arduino: Change Board Type**: Switch your board type or platform.

## Settings

## Device Options

```json
{
    "board": ""
}
```

