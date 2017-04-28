# Change Log
All notable changes to this project will be documented in this file.

## Version 0.1.2
- Release date: April 28, 2017

### Added
- Support manually imported library in libraries manager
- Support 3rd-party boards
- Add more devices (Arduino M0 Pro/Arduino Yún/Arduino Due) for auto discovery
- Add native binaries version for electron 1.6.6 to unblock VSCode's future upgrade
- Scaffold an empty sketch under current workspace folder

### Changed
- Make the arduino.json configurable through UI
- Refine extension activation events
- Restore previous active serial monitor after upload is completed
- Auto-resolve the sketch file path when the file is not existing for verify/upload
- Search custom libraries and examples in the path of sketchbook.path preference rather than default windows Document path

### Fixed
- Fix preferences.txt not found issue
- Fix verify command NPE issue when no serial port is selected
- Fix the error handling issue when opening serial monitor failed
- Avoid verify/upload reentry issue

## Version 0.1.1
- HotFix: Update display tag. 

## Version 0.1.0
- Release date: April 14, 2017
- Release status: Public Preview

### Added
- IntelliSense and syntax highlighting for Arduino sketches (based on [C/C++ for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools))
- Verify and upload your sketches in Visual Studio Code (based on [Arduino IDE](https://www.arduino.cc/en/main/software#download))
- Built-in board and library manager
- Built-in example list
- Built-in serial monitor
- Snippets for sketches
- Automatic Arduino project scaffolding
- Commond Palette (F1) integration of frequently used commands (e.g. Verify, Upload...)
