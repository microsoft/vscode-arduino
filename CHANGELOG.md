# Change Log
All notable changes to this project will be documented in this file.

## Version 0.2.4
- Release date: July 3, 2017

### Added
- Add refresh button on boardmanager/librarymanager view to refresh index files manually

### Changed
- Update license and legal compliance fixes for open source
- The extension is ready for opening issue on github

## Version 0.2.3
- Release date: May 27, 2017

### Changed
- Use a new configuration page for switching arduino boards
- Lazy load the arduino extension on start up, only usb detection works in background, when it detects an arduino board, the extension will fully activate
- Update unit test to some basic arduino commands
- Fix some typos in code
- Fix issue #289 #324 #327

## Version 0.2.2
- Release date: May 19, 2017

### Added
- Support debug for a few boards: arduino zero/M0 Pro, AZ3166, Adafruit Feather M0, Adafruit WICED Feather
- Support debug for stlink, jlink

## Version 0.1.3
- Release date: May 12, 2017

### Added
- Support auto-discovery of AZ3166 board

### Changed
- Make activation condition to activate always for keeping USB auto-detection work background
- Auto-resolve arduino path from Registry on windows
- Well handle the case when vscode has no workspace

### Fixed
- Fix the issue of HTML view showing weird background color in vscode 1.12.1
- Fix arduino board installation failure on Mac after usb detection


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
