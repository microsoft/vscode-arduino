# Visual Studio Code extension for Arduino

[![Gitter](https://img.shields.io/badge/chat-on%20gitter-blue.svg)](https://gitter.im/Microsoft/vscode-arduino)

Welcome to the Visual Studio Code extension for **Arduino** <sup>preview</sup> ! The Arduino extension makes it easy to develop, build, and deploy your Arduino sketches in Visual Studio Code, with a rich set of functionalities. These include:

* IntelliSense and syntax highlighting for Arduino sketches
* Verify and upload your sketches in Visual Studio Code
* Built-in board and library manager
* Built-in example list
* Built-in serial monitor
* Snippets for sketches
* Automatic Arduino project scaffolding
* Command Palette (<kbd>F1</kbd>) integration of frequently used commands (e.g. Verify, Upload...)

## Prerequisites
Either the legacy Arduino IDE or Arduino CLI are required. The recommended
approach is to use the version of Arduino CLI that comes bundled with the
extension, which works out of the box. Support for the legacy Arduino IDE will
be removed in a future version of the extension.

### Arduino CLI
To use the bundled version of Arduino CLI, `arduino.useArduinoCli` should be `true`,
and `arduino.path` and `arduino.commandPath` should be empty or unset.
`arduino.useArduinoCli` defaults to `false` while we deprecate support for the
Arduino IDE, but there will be a prompt when the extension first activates to
switch to the Arduino CLI.

If you want to use a custom version of Arduino CLI, it can be downloaded from
the repository's [release page](https://github.com/arduino/arduino-cli/releases/).
For custom versions, `arduino.path` must be set to the directory containing the
Arduino CLI executable.

### Legacy Arduino IDE
Use of the legacy Arduino IDE is not recommended, and support for the legacy
Arduino IDE will be removed in a future version of the extension. The legacy
Arduino IDE can be installed from the Arduino [download page](https://www.arduino.cc/en/main/software#download).
- The supported legacy Arduino IDE versions are `1.6.x` and up to, but not including, `2.0.0`.
- The Windows Store's version of the Arduino IDE is not supported because of the sandbox environment that the application runs in.
- *Note:* Arduino IDE `1.8.7` had some breaking changes, causing board package and library installation failures.  These failures were corrected in `1.8.8` and later.
- *Note:* Arduino IDE `2.X.Y` is not supported and there are no plans for support in the future ([issue 1477](https://github.com/microsoft/vscode-arduino/issues/1477)).

## Installation
Open VS Code and press <kbd>F1</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> *or* <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open command palette, select **Install Extension** and type `vscode-arduino`.

Or launch VS Code Quick Open (<kbd>Ctrl</kbd> + <kbd>P</kbd> *or* <kbd>Cmd</kbd> + <kbd>P</kbd> ), paste the following command, and press enter.
```bash
ext install vscode-arduino
```

You can also install directly from the Marketplace within Visual Studio Code, searching for `Arduino`.

## Get Started
You can find code samples and tutorials each time that you connect a supported device. Alternatively you can visit our [IoT Developer Blog Space](https://devblogs.microsoft.com/iotdev/) or [Get Started Tutorials](https://docs.microsoft.com/azure/iot-hub/iot-hub-arduino-iot-devkit-az3166-get-started).

## Commands
This extension provides several commands in the Command Palette (<kbd>F1</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> *or* <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>) for working with `*.ino` files:

- **Arduino: Board Manager**: Manage packages for boards. You can add 3rd party Arduino board by configuring `Additional Board Manager URLs` in the board manager.
- **Arduino: Change Board Type**: Change board type or platform.
- **Arduino: Change Timestamp Format**: Change format of timestamp printed before each line of Serial Monitor output.
- **Arduino: Close Serial Monitor**: Stop the serial monitor and release the serial port.
- **Arduino: Examples**: Show list of examples.
- **Arduino: Initialize**: Scaffold a VS Code project with an Arduino sketch.
- **Arduino: Library Manager**: Explore and manage libraries.
- **Arduino: Open Serial Monitor**: Open the serial monitor in the integrated output window.
- **Arduino: Select Serial Port**: Change the current serial port.
- **Arduino: Upload**: Build sketch and upload to Arduino board.
- **Arduino: CLI Upload**: Upload complied code without building sketch (CLI only).
- **Arduino: Upload Using Programmer**: Upload using an external programmer.
- **Arduino: CLI Upload Using Programmer**: Upload using an external programmer without building sketch (CLI only).
- **Arduino: Verify**: Build sketch.
- **Arduino: Rebuild IntelliSense Configuration**: Forced/manual rebuild of the IntelliSense configuration. The extension analyzes Arduino's build output and sets the IntelliSense include paths, defines, compiler arguments accordingly.

## Keybindings
- **Arduino: Upload** <kbd>Alt</kbd> + <kbd>Cmd</kbd> + <kbd>U</kbd> *or* <kbd>Alt</kbd> + <kbd>Ctrl</kbd> + <kbd>U</kbd>
- **Arduino: Verify** <kbd>Alt</kbd> + <kbd>Cmd</kbd> + <kbd>R</kbd> *or* <kbd>Alt</kbd> + <kbd>Ctrl</kbd> + <kbd>R</kbd>
- **Arduino: Rebuild IntelliSense Configuration** <kbd>Alt</kbd> + <kbd>Cmd</kbd> + <kbd>I</kbd> *or* <kbd>Alt</kbd> + <kbd>Ctrl</kbd> + <kbd>I</kbd>

## Options
| Option | Description |
| --- | --- |
| `arduino.useArduinoCli` | Whether to use the Arduino CLI (`true`) or the legacy Arduino IDE (`false`) -- defaults to `false`. If using `true`, either leave the `arduino.path` and `arduino.commandPath` values unset to use the bundled version of Arduino CLI, or point them at a custom version of Arduino CLI. Note that a future version of the extension will change this default to `true` and remove support for legacy Arduino IDE. |
| `arduino.path`  | Path to the Arduino installation.  You can use a custom version of Arduino by modifying this setting to include the full path. Example: `C:\\Program Files\\Arduino` for Windows, `/Applications` for Mac, `/home/<username>/Downloads/arduino-1.8.1` for Linux. (Requires a restart after change). The default value is automatically detected from your legacy Arduino IDE installation path. To use the Arduino CLI, use the path that contains the `arduino-cli` executable (e.g. `/usr/local/bin`), or leave it unset to use the bundled version of Arduino CLI. |
| `arduino.commandPath` | Path to an executable (or script) relative to `arduino.path`. The default value is `arduino_debug.exe` for Windows, `Contents/MacOS/Arduino` for Mac and `arduino` for Linux, You also can use a custom launch script to run Arduino by modifying this setting. (Requires a restart after change) Example: `run-arduino.bat` for Windows, `Contents/MacOS/run-arduino.sh` for Mac and `bin/run-arduino.sh` for Linux. To use the bundled version of Arduino CLI, leave this option unset. To use a custom version of Arduino CLI, use `arduino-cli`. |
| `arduino.additionalUrls` | Additional Boards Manager URLs for 3rd party packages as a string array. The default value is empty. |
| `arduino.logLevel` | CLI output log level. Could be info or verbose. The default value is `"info"`. |
| `arduino.clearOutputOnBuild` | Clear the output logs before uploading or verifying. Default value is `false`. |
| `arduino.allowPDEFiletype` | Allow the VSCode Arduino extension to open .pde files from pre-1.0.0 versions of Arduino. Note that this will break Processing code. Default value is `false`. | 
| `arduino.enableUSBDetection` | Enable/disable USB detection from the VSCode Arduino extension. The default value is `true`. When your device is plugged in to your computer, it will pop up a message "`Detected board ****, Would you like to switch to this board type`". After clicking the `Yes` button, it will automatically detect which serial port (COM) is connected a USB device. If your device does not support this feature, please provide us with the PID/VID of your device; the code format is defined in `misc/usbmapping.json`.To learn more about how to list the vid/pid, use the following tools: https://github.com/EmergingTechnologyAdvisors/node-serialport `npm install -g serialport` `serialport-list -f jsonline`|
| `arduino.disableTestingOpen` | Enable/disable automatic sending of a test message to the serial port for checking the open status. The default value is `false` (a test message will be sent). |
| `arduino.skipHeaderProvider` | Enable/disable the extension providing completion items for headers. This functionality is included in newer versions of the C++ extension. The default value is `false`.|
| `arduino.disableIntelliSenseAutoGen` | When `true` vscode-arduino will not auto-generate an IntelliSense configuration (i.e. `.vscode/c_cpp_properties.json`) by analyzing Arduino's compiler output. |
| `arduino.analyzeOnOpen` | When true, automatically run analysis when the project is opened. Only works when `arduino.analyzeOnSettingChange` is true. |
| `arduino.analyzeOnSettingChange` | When true, automatically run analysis when board, configuration, or sketch settings are changed. |

The following Visual Studio Code settings are available for the Arduino extension. These can be set in global user preferences <kbd>Ctrl</kbd> + <kbd>,</kbd> *or* <kbd>Cmd</kbd> + <kbd>,</kbd> or workspace settings (`.vscode/settings.json`). The latter overrides the former.

```json
{
    "arduino.useArduinoCli": true,
    "arduino.logLevel": "info",
    "arduino.allowPDEFiletype": false,
    "arduino.enableUSBDetection": true,
    "arduino.disableTestingOpen": false,
    "arduino.skipHeaderProvider": false,
    "arduino.additionalUrls": [
        "https://raw.githubusercontent.com/VSChina/azureiotdevkit_tools/master/package_azureboard_index.json",
        "http://arduino.esp8266.com/stable/package_esp8266com_index.json"
    ],
}
```

The following settings are as per sketch settings of the Arduino extension. You can find them in
`.vscode/arduino.json` under the workspace.

```json
{
    "sketch": "example.ino",
    "port": "COM5",
    "board": "adafruit:samd:adafruit_feather_m0",
    "output": "../build",
    "prebuild": "./prebuild.sh",
    "postbuild": "./postbuild.sh",
    "intelliSenseGen": "global"
}
```
- `sketch` - The main sketch file name of Arduino.
- `port` - Name of the serial port connected to the device. Can be set by the `Arduino: Select Serial Port` command. For Mac users could be "/dev/cu.wchusbserial1420".
- `board` - Currently selected Arduino board alias. Can be set by the `Arduino: Change Board Type` command. Also, you can find the board list there.
- `output` - Arduino build output path. If not set, Arduino will create a new temporary output folder each time, which means it cannot reuse the intermediate result of the previous build leading to long verify/upload time, so it is recommended to set the field. Arduino requires that the output path should not be the workspace itself or in a subfolder of the workspace, otherwise, it may not work correctly. By default, this option is not set. It's worth noting that the contents of this file could be deleted during the build process, so pick (or create) a directory that will not store files you want to keep.
- `prebuild` - External command which will be invoked before any sketch build (verify, upload, ...). For details see the [Pre- and Post-Build Commands](#Pre--and-Post-Build-Commands) section.
- `postbuild` - External command to be run after the sketch has been built successfully. See the afore mentioned section for more details.
- `intelliSenseGen` - Override the global setting for auto-generation of the IntelliSense configuration (i.e. `.vscode/c_cpp_properties.json`). Three options are available:
  - `"global"`: Use the global settings (default)
  - `"disable"`: Disable the auto-generation even if globally enabled
  - `"enable"`: Enable the auto-generation even if globally disabled
- `buildPreferences` - Set Arduino preferences which then are used during any build (verify, upload, ...). This allows for extra defines, compiler options or includes. The preference key-value pairs must be set as follows:
```json
    "buildPreferences": [
        ["build.extra_flags", "-DMY_DEFINE=666 -DANOTHER_DEFINE=3.14 -Wall"],
        ["compiler.cpp.extra_flags", "-DYET_ANOTER=\"hello\""]
    ]
}
```

## Known limitations/restrictions

- Header files to include in a `.ino` sketch have to be in a sub-directory (e.g. put a header into `foo/foo.h` and then use `#include foo/foo.h`).  Without this subdirectory (e.g. `foo.h` directly next to the `.ino` file using `#include "foo.h"`), the compile step will fail. ([issue 1389](https://github.com/microsoft/vscode-arduino/issues/1389)



## Pre- and Post-Build Commands
On Windows the commands run within a `cmd`-, on Linux and OSX within a `bash`-instance. Therefore your command can be anything what you can run within those shells. Instead of running a command you can invoke a script. This makes writing more complex pre-/post-build mechanisms much easier and opens up the possibility to run python or other scripting languages.
The commands run within the workspace root directory and vscode-arduino sets the following environment variables:
**`VSCA_BUILD_MODE`** The current build mode, one of `Verifying`, `Uploading`, `Uploading (programmer)` or `Analyzing`. This allows you to run your script on certain build modes only.
**`VSCA_SKETCH`** The sketch file relative to your workspace root directory.
**`VSCA_BOARD`** Your board and configuration, e.g. `arduino:avr:nano:cpu=atmega328`.
**`VSCA_WORKSPACE_DIR`** The absolute path of your workspace root directory.
**`VSCA_LOG_LEVEL`** The current log level. This allows you to control the verbosity of your scripts.
**`VSCA_SERIAL`** The serial port used for uploading. Not set if you haven't set one in your `arduino.json`.
**`VSCA_BUILD_DIR`** The build directory. Not set if you haven't set one in your `arduino.json`.

For example under Windows the following `arduino.json` setup
```json
{
    "board": "arduino:avr:nano",
    "sketch": "test.ino",
    "configuration": "cpu=atmega328",
    "prebuild": "IF \"%VSCA_BUILD_MODE%\"==\"Verifying\" (echo VSCA_BUILD_MODE=%VSCA_BUILD_MODE% && echo VSCA_BOARD=%VSCA_BOARD%)"
}
```
will produce
```
[Starting] Verifying sketch 'test.ino'
Running pre-build command: "IF "%VSCA_BUILD_MODE%"=="Verifying" (echo VSCA_BUILD_MODE=%VSCA_BUILD_MODE% && echo VSCA_BOARD=%VSCA_BOARD%)"
VSCA_BUILD_MODE=Verifying
VSCA_BOARD=arduino:avr:nano:cpu=atmega328
Loading configuration...
<...>
```
when verifying.

## IntelliSense
vscode-arduino auto-configures IntelliSense by default. vscode-arduino analyzes Arduino's compiler output by running a separate build and generates the corresponding configuration file at `.vscode/c_cpp_properties.json`. vscode-arduino tries as hard as possible to keep things up to date, e.g. it runs the analysis when switching the board or the sketch.

It doesn't makes sense though to run the analysis repeatedly. Therefore if the workspace reports problems ("squiggles") - for instance after adding new includes from a new library - run the analysis manually:

Manual rebuild: **Arduino: Rebuild IntelliSense Configuration**,
Keybindings: <kbd>Alt</kbd> + <kbd>Cmd</kbd> + <kbd>I</kbd> *or* <kbd>Alt</kbd> + <kbd>Ctrl</kbd> + <kbd>I</kbd>

When the analysis is invoked manually it ignores any global and project specific disable.

### IntelliSense Configurations
vscode-arduino's analysis stores the result as a dedicated IntelliSense-configuration named `Arduino`. You have to select it from the far right of the status bar when you're in one of your source files as shown here:

![74001156-cfce8280-496a-11ea-9b9d-7d30c83765c1](https://user-images.githubusercontent.com/21954933/74351237-2696ea80-4db7-11ea-9f7a-1bfc652ad5f5.png)

This system allows you to setup and use own IntelliSense configurations in parallel to the automatically generated configurations provided through vscode-arduino. Just add your configuration to `c_cpp_properties.json` and name it differently from the default configuration (`Arduino`), e.g. `My awesome configuration` and select it from the status bar or via the command palette command **C/C++: Select a Configuration...**

## Change Log
See the [Change log](https://github.com/Microsoft/vscode-arduino/blob/main/CHANGELOG.md) for details about the changes in each version.

## Supported Operating Systems
Currently this extension supports the following operating systems:

- Windows 7 and later (32-bit and 64-bit)
- macOS 10.10 and later
- Ubuntu 16.04
  - The extension might work on other Linux distributions, as reported by other users, but without guarantee.

## Support
You can find the full list of issues on the [Issue Tracker](https://github.com/Microsoft/vscode-arduino/issues). You can submit a [bug or feature suggestion](https://github.com/Microsoft/vscode-arduino/issues/new), and participate in community driven [discussions](https://gitter.im/Microsoft/vscode-arduino).

## Development

Installation prerequisites:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (>= 12.x)
- [Npm](https://www.npmjs.com/) (>= 6.x)

To *run and develop*, do the following:
- `git clone https://github.com/microsoft/vscode-arduino`
- `cd vscode-arduino`
- Run `npm i`
- Run `npm i -g gulp`
- Open in Visual Studio Code (`code .`)
- Press <kbd>F5</kbd> to debug.

To *test*, press <kbd>F5</kbd> in VS Code with the "Launch Tests" debug configuration.

## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct). For more information please see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/#howadopt) or contact opencode@microsoft.com with any additional questions or comments.

## Privacy Statement
The [Microsoft Enterprise and Developer Privacy Statement](https://www.microsoft.com/en-us/privacystatement/EnterpriseDev/default.aspx) describes the privacy statement of this software.

## License
This extension is licensed under the [MIT License](https://github.com/Microsoft/vscode-arduino/blob/main/LICENSE.txt). Please see the [Third Party Notice](https://github.com/Microsoft/vscode-arduino/blob/main/ThirdPartyNotices.txt) file for additional copyright notices and terms.

## Contact Us
If you would like to help build the best Arduino experience with VS Code, you can reach us directly at [gitter chat room](https://gitter.im/Microsoft/vscode-arduino).
