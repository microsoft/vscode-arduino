# Visual Studio Code extension for Arduino

[![Gitter](https://img.shields.io/badge/chat-on%20gitter-blue.svg)](https://gitter.im/Microsoft/vscode-arduino)
[![Travis CI](https://travis-ci.org/Microsoft/vscode-arduino.svg?branch=master)](https://travis-ci.org/Microsoft/vscode-arduino)

Welcome to Visual Studio Code extension for **Arduino** <sup>preview</sup> ! The Arduino extension makes it easy to code, build, deploy and debug your Arduino sketches in Visual Studio Code, with a rich set of functionalities:

* IntelliSense and syntax highlighting for Arduino sketches
* Verify and upload your sketches in Visual Studio Code
* Built-in board and library manager
* Built-in example list
* Built-in serial monitor
* Snippets for sketches
* Automatic Arduino project scaffolding
* Command Palette (`F1`) integration of frequently used commands (e.g. Verify, Upload...)
* Integrated Arduino Debugging <sup>New</sup>

## Prerequisites
Arduino IDE is required. Please install it from [here](https://www.arduino.cc/en/main/software#download).
- The supported Arduino IDE versions are 1.6.x and later.
- The Windows Store's version of Arduino IDE is not supported because of the sandbox environment of Windows app.

## Installation
Open VS Code and press `F1` or `Ctrl + Shift + P` to open command palette, select **Install Extension** and type `vscode-arduino`.

Or launch VS Code Quick Open (`Ctrl + P`), paste the following command, and press enter.
```bash
ext install vscode-arduino
```
You can also install directly from Marketplace within Visual Studio Code, searching `Arduino`.

## Get Started
You can find code samples and tutorials each time you connect a supported device.
Alternatively you can visit our [IoT Developer Blog Space](https://aka.ms/iotdevblog) or [Get Started Tutorials](https://docs.microsoft.com/azure/iot-hub/iot-hub-arduino-iot-devkit-az3166-get-started).

## Commands
This extension provides several commands in the Command Palette (`F1` or `Ctrl + Shift + P`) for working with `*.ino` files:

- **Arduino: Board Manager**: Manage packages for boards. You can add 3rd party Arduino board by configuring `Additional Board Manager URLs` in board manager.
- **Arduino: Change Baud Rate**: Change the baud rate of selected serial port.
- **Arduino: Change Board Type**: Change board type or platform.
- **Arduino: Close Serial Monitor**: Stop serial monitor and release the serial port.
- **Arduino: Examples**: Show example list.
- **Arduino: Initialize**: Scaffold a VS Code project with an Arduino sketch.
- **Arduino: Library Manager**: Explore and manage libraries.
- **Arduino: Open Serial Monitor**: Open serial monitor in the intergrated output window.
- **Arduino: Select Serial Port**: Change the current serial port.
- **Arduino: Send Text to Serial Port**: Send a line of text via the current serial port.
- **Arduino: Upload**: Build sketch and upload to Arduino board.
- **Arduino: Upload Using Programmer**: Upload using  an external programmer.
- **Arduino: Verify**: Build sketch.

## Options
The following Visual Studio Code settings are available for the Arduino extension. These can be set in global user preferences `Ctrl + ,` or workspace settings (.vscode/settings.json). The later overrides the former.

```json
{
    "arduino.path": "C:/Program Files (x86)/Arduino",
    "arduino.commandPath": "run-arduino.bat",
    "arduino.additionalUrls": "",
    "arduino.logLevel": "info",
    "arduino.enableUSBDetection": true,
    "arduino.disableTestingOpen": false
}
```
- `arduino.path` - Path to Arduino, you can use a custom version of Arduino by modifying this setting to include the full path. Example: `C:\\Program Files\\Arduino` for Windows, `/Applications` for Mac, `/home/$user/Downloads/arduino-1.8.1` for Linux. (Requires a restart after change). The default value is automatically detected from your Arduino IDE installation path.
- `arduino.commandPath` - Path to an executable (or script) relative to `arduino.path`. You can use a custom launch script to run Arduino by modifying this setting. (Requires a restart after change) Example: `run-arduino.bat` for Windows, `Contents/MacOS/run-arduino.sh` for Mac, `bin/run-arduino.sh` for Linux."
- `arduino.additionalUrls` - Additional URLs for 3rd party packages. You can have multiple URLs in one string with comma(,) as separator, or have a string array. The default value is empty.
- `arduino.logLevel` - CLI output log level. Could be info or verbose. The default value is `"info"`.
- `arduino.enableUSBDetection` - Enable/disable USB detection from the VSCode Arduino extension. The default value is `true`.
- `arduino.disableTestingOpen` - Disable/enable auto sending a test message to serial port for checking open status. The default value is `false` (a test message will be sent).

The following settings are per sketch settings of the Arduino extension. You can find them in
`.vscode/arduino.json` under the workspace.

```json
{
    "sketch": "example.ino",
    "port": "COM5",
    "board": "adafruit:samd:adafruit_feather_m0",
    "output": "../build",
    "debugger": "jlink",
    "prebuild": "bash prebuild.sh"
}
```
- `sketch` - The main sketch file name of Arduino.
- `port` - Name of the serial port connected to the device. Can be set by the `Arduino: Select Serial Port` command.
- `board` - Current selected Arduino board alias. Can be set by the `Arduino: Change Board Type` command. Also, you can find the board list there.
- `output` - Arduino build output path. If not set, Arduino will create a new temporary output folder each time, which means it cannot reuse the intermediate result of the previous build, leading to long verify/upload time. So it is recommended to set the field. Arduino requires that the output path should not be the workspace itself or subfolder of the workspace, otherwise, it may not work correctly. By default, this option is not set.
- `debugger` - The short name of the debugger that will be used when the board itself does not have any debugger and there are more than one debugger available. You can find the list of debuggers [here](https://github.com/Microsoft/vscode-arduino/blob/master/misc/debuggerUsbMapping.json). By default, this option is not set.
- `prebuild` - External command before build sketch file. You should only set one prebuild command. `command1 && command2` doesn't work. If you need run multiple commands before build, write them into a script.

## Debugging Arduino Code <sup>preview</sup>
Before you start debug your Arduino code, read [this doc](https://code.visualstudio.com/docs/editor/debugging) and get to know the basic mechanism about debugging in Visual Studio Code. Also see [debugging for C++ in VSCode](https://code.visualstudio.com/docs/languages/cpp#_debugging) for your reference.

Make sure your Arduino board can work with [STLink](http://www.st.com/en/development-tools/st-link-v2.html), [Jlink](https://www.segger.com/jlink-debug-probes.html) or [EDBG](http://www.atmel.com/webdoc/protocoldocs/ch01s01.html). The debugging support currently is fully tested with the following boards.
- [MXChip IoT Developer Kit - AZ3166](https://microsoft.github.io/azure-iot-developer-kit/)
- [Arduino M0 PRO](https://www.arduino.cc/en/Main/ArduinoBoardM0PRO)
- [Adafruit WICED WiFi Feather](https://www.adafruit.com/product/3056)
- [Adafruit Feather M0](https://www.adafruit.com/product/3010)
- Arduino Zero Pro

Steps to start debugging:
1. Plugin your board to your development machine properly. For those boards don't have on-board debugging chip, you need use STLink or JLink connector.
2. Go to **Debug View** (`Ctrl + Shift + D`). Set breakpoints in your source files.
3. Press `F5` to select debugging environment.
4. When your breakpoint is hit, you can see variables and add expression to watch on the Debug Side Bar.

> To learn more about how to debug Arduino code, visit our [team blog](https://blogs.msdn.microsoft.com/iotdev/2017/05/27/debug-your-arduino-code-with-visual-studio-code/).

## Change Log
See the [Change log](https://github.com/Microsoft/vscode-arduino/blob/master/CHANGELOG.md) for the details of changes for each version.

## Supported Operating Systems
Currently this extension supports the following operatings systems:

- Windows 7 and later (32-bit and 64-bit)
- macOS 10.10 and later
- Ubuntu 16.04
  - The extension might work on other Linux distro as some user reported but without gurantee.

## Support
You can find the full list of issues at [Issue Tracker](https://github.com/Microsoft/vscode-arduino/issues). You can submit a [bug or feature suggestion](https://github.com/Microsoft/vscode-arduino/issues/new), and participate community driven [discussions](https://gitter.im/Microsoft/vscode-arduino).

## Development

Installing Prerequisites:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (>= 6.5.0)
- [Npm](https://www.npmjs.com/) (>= 3.10.3)

To *run and develop*, do the following:
- `git clone https://github.com/microsoft/vscode-arduino`
- `cd vscode-arduino`
- Run `npm i`
- Run `npm i -g gulp`
- Open in Visual Studio Code (`code .`)
- Press `F5` to debug

To *test do the following*: `F5` in VS Code with the "Launch Tests" debug configuration.

## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct). For more information please see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/#howadopt) or contact opencode@microsoft.com with any additional questions or comments.

## Privacy Statement
The [Microsft Enterprise and Developer Privacy Statement](https://www.microsoft.com/en-us/privacystatement/EnterpriseDev/default.aspx) describes the privacy statement of this software.

## License
This extension is licensed under [MIT License](https://github.com/Microsoft/vscode-arduino/blob/master/LICENSE.txt). Please see the [Third Party Notice](https://github.com/Microsoft/vscode-arduino/blob/master/ThirdPartyNotices.txt) file for additional copyright notices and terms.

## Contact Us
If you would like to help build the best Arduino experience with VS Code, you can reach us directly at [gitter chat room](https://gitter.im/Microsoft/vscode-arduino).
