# Arduino for Visual Studio Code

[![Gitter](https://img.shields.io/badge/chat-on%20gitter-blue.svg)](https://gitter.im/Microsoft/vscode-arduino)

Welcome to **Arduino** <sup>preview</sup> for Visual Studio Code! The Arduino extension makes it easy to code, build and deploy your Arduino sketches in Visual Studio Code.

* IntelliSense and syntax highlighting for Arduino sketches
* Verify and upload your sketches in Visual Studio Code
* Built-in board and library manager
* Built-in example list
* Built-in serial monitor
* Snippets for sketches
* Automatic Arduino project scaffolding
* Command Palette (F1) integration of frequently used commands (e.g. Verify, Upload...)

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

## Commands
This extension provides several commands in the Command Palette (**F1** or **Ctrl+Shift+P**) for working with `*.ino` files:

- **Arduino: Boards Manager**: Manage packages for boards. You can add 3rd party Arduino board by configuring `Additional Board Manager URLs` in board manager.
- **Arduino: Change Baud Rate**: Change the baud rate of selected serial port.
- **Arduino: Change Board Type**: Change board type or platform.
- **Arduino: Close Serial Monitor**: Stop serial monitor and release the serial port.
- **Arduino: Examples**: Show example list.
- **Arduino: Initialize**：Scaffold a VS Code project with an Arduino sketch.
- **Arduino: Libraries Manager**: Explore and manage libraries.
- **Arduino: Open Serial Monitor**: Open serial monitor in the intergrated output window.
- **Arduino: Select Serial Port**: Change the current serial port.
- **Arduino: Send Text to Serial Port**: Send a line of text via the current serial port.
- **Arduino: Upload**: Build sketch and upload to Arduino board.
- **Arduino: Verify**: Build sketch.

## Options
The following Visual Studio Code settings are available for the Arduino extension. These can user preferences `Ctrl + ,` or workspace settings (.vscode/settings.json). The later overrides the former.

```json
{
    "arduino.path": "C:/Program Files (x86)/Arduino",
    "arduino.additionalUrls": "",
    "arduino.autoUpdateIndexFiles": false,
    "arduino.logLevel": "info"
}
```
- `arduino.path` - Path to Arduino, you can use a custom version of Arduino by modifying this setting to include the full path. Example: `C:\\Program Files\\Arduino` for Windows, `/Applications` for Mac, `/home/$user/Downloads/arduino-1.8.1` for Linux. (Requires a restart after change). The default value is automatically detected from your Arduino IDE installation path.
- `arduino.additionalUrls` - Additional URLs for 3rd party packages. You can have multiple URLs in one string with comma(,) as separator, or have a string array. The default value is empty.
- `arduino.autoUpdateIndexFiles` - Controls auto update of package_index.json and library_index.json index files. If enabled, each time when you open Boards Manager/Libraries Manager, download latest index files first. Otherwise, using index files cached on local disk for Boards Manager/Libraries Manager. The default value is `false`.
- `arduino.logLevel` - CLI output log level. Could be info or verbose. The default value is `"info"`.

## Supported Operating Systems
Currently this extension supports the following operatings systems:

- Windows 7 and later (32-bit and 64-bit)
- macOS 10.10 and later
- Ubuntu 16.04
  - The extension might work on other Linux distro as some user reported but without gurantee.

## Contact Us
If you'd like to help us build the best Arduino experience with VS Code, you can talk directly to the product team in our [gitter chat room](https://gitter.im/Microsoft/vscode-arduino).
