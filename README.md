# Arduino for Visual Studio Code

Welcome to **Arduino** for Visual Studio Code! The Arduino extension makes it easy to code, build and deploy your Arduino sketches in Visual Studio Code.

* Verify and upload your Arduino sketches in Visual Studio Code.
* Built-in Arduino board and library manager.
* Built-in Arduino example list.
* Built-in serial port monitoring tool.
* IntelliSense support and syntax highlighting.
* Snippets for \*.ino files.
* Commond Palette(F1) integration for most common Arduino commands (e.g. Verify, Upload...).
* TBD: Customizable extension options including command shortcuts and more.
* TBD: F5 integration with debugging support.

## Prerequisites

- [Arduino IDE](https://www.arduino.cc/en/main/software). Please choose stable version for your operating system.
- [clang](http://releases.llvm.org/download.html). Please install the pre-built binaries for your operating system.
- [Visual Studio Code](https://code.visualstudio.com/#alt-downloads)

## Using
- First, open your Visual Studio Code to install the **vscode-arduino** extension manually from Extensions Activity Bar.

![Install from VSIX](/images/install_from_vsix.png)

- Open an exsiting Arduino sketch folder and change the language mode to **Arduino**.

![Change language mode](/images/change_language_mode.png)

- Press **F1** or **Ctrl+Shift+P** to open command palette, select and run **Add library paths**. There will be a `arduino.json` file generated in your `.vscode` folder.

![Add lib paths](/images/add_lib_path.png)

- Start working on your Arduino sketch by using the commands below.

## Commands
This extension provides several commands in the Command Palette (**F1** or **Ctrl+Shift+P**) for working with `*.ino` files:
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

## Supported Operating Systems
Currently this extension supports the following operatings systems:

- Windows 7 and later (32-bit and 64-bit)
- macOS 10.10 and later
- Ubuntu 16.04