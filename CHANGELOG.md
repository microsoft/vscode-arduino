# Change Log
All notable changes to this project will be documented in this file.

## Version 0.6.0

- Release date: March 15, 2023

### Added

- Prerelease versions are now published nightly to the VS Code Marketplace if there were changes to the repo. Prerelease versions will always have a non-zero patch digit in their version number.

### Changed

- The bundled version of the Arduino CLI was updated to [version 0.31.0](https://github.com/arduino/arduino-cli/releases/tag/0.31.0). [#1606](https://github.com/microsoft/vscode-arduino/pull/1606)
- All functionality related to the `arduino` debug type was removed from the extension. The built-in debugging support was rarely used and not actively maintained. [#1610](https://github.com/microsoft/vscode-arduino/pull/1610)

### Fixed

- When using the bundled Arduino CLI, the extension will no longer attempt to make the CLI executable if it is already executable. Additionally, any errors that occur while attempting to make the CLI executable are shown in a notification. [#1601](https://github.com/microsoft/vscode-arduino/pull/1601)
- Refreshing the index in the board manager or library manager now works correctly with the Arduino CLI, and additional URLs from the `arduino.additionalUrls` setting are passed to the Arduino CLI. [#1611](https://github.com/microsoft/vscode-arduino/pull/1611)

## Version 0.5.0

- Release date: February 16, 2023

**Support for the legacy Arduino IDE will be removed in the next release of this extension.** Please start using the Arduino CLI as soon as possible.

### Added

- [Arduino CLI](https://arduino.github.io/arduino-cli/0.30/) version 0.30.0 is now bundled with the extension [#1584](https://github.com/microsoft/vscode-arduino/pull/1584). To use the bundled version of Arduino CLI, `arduino.useArduinoCli` should be `true`, and `arduino.path` and `arduino.commandPath` should be empty or unset. Additionally, prompts will appear to switch to the bundled version whenever the legacy Arduino IDE is used or manually specified Arduino tools cannot be found.
- A warning will appear in the Board Configuration view when no boards are installed. This warning links to the Board Manager view to install boards. [#1592](https://github.com/microsoft/vscode-arduino/pull/1592)
- A warning will appear in the Arduino Examples view when no examples are installed. [#1594](https://github.com/microsoft/vscode-arduino/pull/1594)

### Changed

- The extension's built-in serial monitor has been removed and replaced by a dependency on the [Serial Monitor extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-serial-monitor) [#1577](https://github.com/microsoft/vscode-arduino/pull/1577). There are a few breaking changes as a result of this change:
  - `arduino.defaultBaudRate` and `arduino.defaultTimestampFormat` have been removed. Equivalent functionality is available through the `vscode-serial-monitor.customBaudRates` and `vscode-serial-monitor.timestampFormat` settings.
  - The "Change Baud Rate" command has been removed. Equivalent functionality is available in the Serial Monitor UI or via the Serial Monitor extension API.
- Survey prompts have been removed. [#1588](https://github.com/microsoft/vscode-arduino/pull/1588)

### Fixed

- The IntelliSense configuration step can now correctly parse Arduino CLI output [#1591](https://github.com/microsoft/vscode-arduino/pull/1591).

## Version 0.4.13

- Release date: January 24, 2023

### Changed

- Upgrade dependencies to address security and deprecation issues.

## Version 0.4.12

- Release date: May 3, 2022

### Added

- Support Remote Development Board Selection [#1459](https://github.com/microsoft/vscode-arduino/pull/1459)
- Add analyzeOnOpen and analyzeOnSettingChange [#1480](https://github.com/microsoft/vscode-arduino/pull/1480)

### Changed

- Fix Launch Extension gulp Not Found on Linux [#1461](https://github.com/microsoft/vscode-arduino/pull/1461)
- Change link to list of all available placeholders [#1470](https://github.com/microsoft/vscode-arduino/pull/1470)
- Keep DTR, CTS, and RTS high [#1479](https://github.com/microsoft/vscode-arduino/pull/1479)
- Don't use * activation event [#1481](https://github.com/microsoft/vscode-arduino/pull/1481)
- Scope activation to only *.ino files [#1484](https://github.com/microsoft/vscode-arduino/pull/1484)
- Remove the addition of the board name to create specific temp files [#1486](https://github.com/microsoft/vscode-arduino/pull/1486)
- Fix out of date packages [#1493](https://github.com/microsoft/vscode-arduino/pull/1493)
- Fix line-oriented callbacks [#1494](https://github.com/microsoft/vscode-arduino/pull/1494)
- Add additional verbose output regex [#1498](https://github.com/microsoft/vscode-arduino/pull/1498)

## Version 0.4.11

- Release date: February 10, 2022

### Changed

This release includes a major change in internal handling of serial port
communication ([#1450](https://github.com/microsoft/vscode-arduino/pull/1450)),
which is designed to address antivirus false positives from the old serial
monitor. Please report any issues you see with the serial monitor.

- Show all supported boards and set default build directory [#1425](https://github.com/microsoft/vscode-arduino/pull/1425)
- Add option for printing timestamp before each line of Serial Monitor output [#1430](https://github.com/microsoft/vscode-arduino/pull/1430)
- Fix problem with stripping whitespace [#1433](https://github.com/microsoft/vscode-arduino/pull/1433)
- Added Mac shortcuts on readme [#1439](https://github.com/microsoft/vscode-arduino/pull/1439)
- Switch from serial-monitor-cli to node-serialport [#1450](https://github.com/microsoft/vscode-arduino/pull/1450)

## Version 0.4.10

- Release date: January 14, 2022

### Changed

- Fix for uploading with programmer [#1369](https://github.com/microsoft/vscode-arduino/pull/1369)
- Output sketch memory usage in non-verbose mode [#1383](https://github.com/microsoft/vscode-arduino/pull/1383)
- Using the codepage with arduino.l4j.ini on win32 [#1271](https://github.com/microsoft/vscode-arduino/pull/1271)
- Improve additionalUrls settings UI [#1419](https://github.com/microsoft/vscode-arduino/pull/1419)
- Mark serial monitor as executable on Mac and Linux [#1420](https://github.com/microsoft/vscode-arduino/pull/1420)

## Version 0.4.9

- Release date: January 12, 2022

### Changed

- vid and pid for Adafruit Grand Central M4 (SAMD51) [#1218](https://github.com/microsoft/vscode-arduino/pull/1218)
- Add clear output on build option [#1057](https://github.com/microsoft/vscode-arduino/pull/1057)
- Added buffering to prevent heavy logging issues [#1412](https://github.com/microsoft/vscode-arduino/pull/1412)

## Version 0.4.8

- Release date: November 9, 2021

### Changed

- Fix application insights key [31dd3a9](https://github.com/microsoft/vscode-arduino/commit/31dd3a94c64eb12a5483038c5bfe668abad36f91)

## Version 0.4.7

- Release date: November 5, 2021

### Changed

- Add support for ST-Link v3.0 [#1366](https://github.com/microsoft/vscode-arduino/pull/1366)
- Fix empty board and examples list [#1367](https://github.com/microsoft/vscode-arduino/pull/1367)
- Fix ESLint parsing for enums [#1368](https://github.com/microsoft/vscode-arduino/pull/1368)
- Fix build cwd [#1375](https://github.com/microsoft/vscode-arduino/pull/1375)
- Fix stack overflow in board configuration view [#1379](https://github.com/microsoft/vscode-arduino/pull/1379)

## Version 0.4.6

- Release date: September 29, 2021

### Changed

- Fix send serial message [#1356](https://github.com/microsoft/vscode-arduino/pull/1356)
- Update eslint to latest version and fix issues reported [#1352](https://github.com/microsoft/vscode-arduino/pull/1352)

## Version 0.4.5

- Release date: September 21, 2021

### Changed
- Various minor updates to documentation [#1349](https://github.com/microsoft/vscode-arduino/pull/1349)
- Don't set `commandPath` when `arduino-cli` is `true` [#1297](https://github.com/microsoft/vscode-arduino/pull/1297)

## Version 0.4.4

- Release date: August 26, 2021

### Changed
- Serial monitor uses a new backend which doesn't break with updates of VSCode. [#1322](https://github.com/microsoft/vscode-arduino/pull/1322)

## Version 0.4.3

- Release date: May 12, 2021

### Fixed
- Update node-usb-native to v0.0.20 to fix serial and port selecting [#1257](https://github.com/microsoft/vscode-arduino/issues/1257)
- Updated dependencies

## Version 0.4.2

- Release date: April 22, 2021

### Fixed
- Update app insights key

## Version 0.4.1

- Release date: April 19, 2021

### Added
- Quickpick sketch selection [#1128](https://github.com/microsoft/vscode-arduino/pull/1128) Thanks [@maddogjt](https://github.com/maddogjt)

### Fixed
- Arduino CLI on MacOS [#1221](https://github.com/microsoft/vscode-arduino/issues/1221) Thanks [@awmichel](https://github.com/awmichel)
- Typos [#1226](https://github.com/microsoft/vscode-arduino/pull/1226), [#1225](https://github.com/microsoft/vscode-arduino/pull/1225), [#1191](https://github.com/microsoft/vscode-arduino/pull/1191) Thanks [@jogo-](https://github.com/jogo-) [@CBielstein](https://github.com/CBielstein)
- add USBCON back into IntelliSense config [#1216](https://github.com/microsoft/vscode-arduino/issues/1216)
- Update dependencies
- App Insights key in Actions [#1236](https://github.com/microsoft/vscode-arduino/pull/1236)

## Version 0.4.0

- Release date: March 22. 2021

### Added
- Support for Arduino CLI #1017

### Changed
- Autogenerate c_cpp_properties.json with all complier arguments and libraries for IntelliSense #1183
- Detects available programmers for selected board #1118

### Fixed
- Typos

### Breaking Changes
- Unifies all build commands under a single

### Known Issues
- Arduino CLI doesn't work on Mac [#1205](https://github.com/microsoft/vscode-arduino/issues/1205)

## Version 0.3.5

- Release date: November 22, 2020

### Fixes
- Update to node-usb-native 0.0.19

## Version 0.3.4

- Release date: November 22, 2020

### Changed
- Add DTR and RTS signals on serial open and baud rate change
- Improves c_cpp_properties.json autogeneration for IntelliSense

## Version 0.3.3

- Release date: October 29, 2020

### Changed
- Update node-usb-native dependency to fix serial port issue from VS Code's Electron version update.

## Version 0.3.2

- Release date: August 26, 2020

### Changed
- Update dependencies.

## Version 0.3.1

- Release date: June 9, 2020

### Fixed

- Fix issue of serial monitor keeps esp devices in flash mode. [[#1015](https://github.com/microsoft/vscode-arduino/issues/1015)]

### Changed
- Suppress sending telemetry data with error details

## Version 0.3.0

- Release date: March 26, 2020

### Fixed

- Support Electron v7. Fix issue of "Unable to use serial port in VS Code Version 1.43.0". [[#980](https://github.com/microsoft/vscode-arduino/issues/980)]
- Fix issue of "Fail to debug on Ubuntu". [[#933](https://github.com/microsoft/vscode-arduino/issues/933)]
- Remove line ending selection. Fix the issue of "Save the last used end of line". [[#952](https://github.com/microsoft/vscode-arduino/issues/952)]
- Fix the issue of "Can't install libraries from VS Code for ESP8266". [[#930](https://github.com/microsoft/vscode-arduino/issues/930)]
- Fix the issue of "Project path cannot be changed". [[#978](https://github.com/microsoft/vscode-arduino/issues/978)]

Special thanks to [raomin](https://github.com/raomin), thanks for your contributions and feedbacks.

## Version 0.2.29

- Release date: January 2, 2020

### Changed
- Dependency upgrade

## Version 0.2.28

- Release date: November 15, 2019

### Fixed

- Optimize activation time  of Arduino Extension.
- Bump mixin-deep from 1.3.1 to 1.3.2.
- Remove Processing Filetype (.PDE extension).
- Fix the issue of "Unable to select serial port" [[#918]](https://github.com/microsoft/vscode-arduino/issues/918)
- Fix Travis CI build failure [[#900]](https://github.com/microsoft/vscode-arduino/issues/900)
- Fix issue of "Exit with code=undefined" [[#869]](https://github.com/microsoft/vscode-arduino/issues/869)
- Fix issue of "spawn: Use explicit chcp.com" [[#910]](https://github.com/microsoft/vscode-arduino/pull/910)
- Fix wording & typos.

Special thanks to [Peter Wone](https://github.com/PeterWone), [Dre West](https://github.com/Dotrar),[Lucas Schneider](https://github.com/schneider8357) for your contributions and feedbacks.

## Version 0.2.27

- Release date: July 8, 2019

### Fixed
- Fix the issue of "Unable to start serial monitor" [#851](https://github.com/microsoft/vscode-arduino/issues/851) which started after update to VS Code 1.36.0.

Special thanks to [Aboulfad](https://github.com/aboulfad), [szormok](https://github.com/szormok), [MichaelPfezer](https://github.com/MichaelPfezer), [CodeNameHawk](https://github.com/CodeNameHawk), [Rafu](https://github.com/rafalp9728) and [Cube-Line](https://github.com/Cube-Line), thanks for your contributions and feedbacks.

## Version 0.2.26

- Release date: May 30, 2019

### Added
- Add .pde support

### Changed
- The value of 'Include Path' will be updated automatically when board package is updated

### Fixed
- Fix the issue of "ST-Link upload - Please specify the upload serial port" [#595](https://github.com/microsoft/vscode-arduino/issues/595)

Special thanks to [Riz-waan](https://github.com/Riz-waan), [LuisAbrantes](https://github.com/LuisAbrantes), [Christopher Schmitz](https://github.com/chris-schmitz), [Christian](https://github.com/ChriD) and [LMtx](https://github.com/LMtx), thanks for your contributions and feedbacks.

## Version 0.2.25

- Release date: January 10, 2019

### Added
- Add upload and verify button in action bar [#737](https://github.com/Microsoft/vscode-arduino/pull/737)
- Add serial port support for Electron 3.0 [#729](https://github.com/Microsoft/vscode-arduino/pull/729), [#730](https://github.com/Microsoft/vscode-arduino/pull/730), [#731](https://github.com/Microsoft/vscode-arduino/pull/731)

Special thanks to [Michael Omiccioli](https://github.com/momiccioli) and [MarNwk](https://github.com/MarNwk), thank you for your feedbacks.

## Version 0.2.24

- Release date: December 11, 2018

### Added
- Add debugging support for cmsis-dap with Keil Software vid [#634](https://github.com/Microsoft/vscode-arduino/pull/634)

### Changed
- Save the selected programmer in Arduino.json [#714](https://github.com/Microsoft/vscode-arduino/pull/714)

### Fixed
- Fix dependency issue [#716](https://github.com/Microsoft/vscode-arduino/pull/716)
- Install latest arduino on Mac [#724](https://github.com/Microsoft/vscode-arduino/pull/724)

Special thanks to [Deqing Sun](https://github.com/DeqingSun), thank you for your contributions and feedbacks.

## Version 0.2.23

- Release date: November 22, 2018

### Added
- Add debugging support for uno [#685](https://github.com/Microsoft/vscode-arduino/pull/685)
- Add Wio LTE M1/NB1(BG96) board [#703](https://github.com/Microsoft/vscode-arduino/pull/703)
- Add contribution guidelines [#665](https://github.com/Microsoft/vscode-arduino/pull/665)
- Add sketches folder into examples view [#652](https://github.com/Microsoft/vscode-arduino/issues/652)

### Changed
- Change Arduino language ID to C++ [#686](https://github.com/Microsoft/vscode-arduino/issues/686)
- Use VS Code new webview API [#701](https://github.com/Microsoft/vscode-arduino/issues/701)

### Fixed
- Fix major grammatical issues & formatting issues [#681](https://github.com/Microsoft/vscode-arduino/pull/681)
- Spelling and grammar updates to README [#679](https://github.com/Microsoft/vscode-arduino/pull/679)

Special thanks to [Deqing Sun](https://github.com/DeqingSun), [Takashi Matsuoka](https://github.com/matsujirushi), [Chinmay Chandak](https://github.com/CCAtAlvis), [aster94](https://github.com/aster94), [Ajit Panigrahi](https://github.com/AjitZero) and [Konrad Blum](https://github.com/kblum), thank you for your contributions and feedbacks.

## Version 0.2.22

- Release date: October 18, 2018

### Added
- Add Net Satisfaction Score survey

## Version 0.2.21
- Release date: October 10, 2018

### Changed
- Fix the output path not exist issue [#641](https://github.com/Microsoft/vscode-arduino/issues/641)
- Update arduino.path instruction [#635](https://github.com/Microsoft/vscode-arduino/issues/635)

Special thanks to [aster94](https://github.com/aster94), [Niels van der Veer](https://github.com/n9iels), [AntoineGirafe](https://github.com/AntoineGirafe), thank you for your contributions and feedbacks.

## Version 0.2.20

- Release date: August 16, 2018

### Changed
- Add arduino.defaultBaudRate option [#616](https://github.com/Microsoft/vscode-arduino/issues/616)
- Pop up a message to help the user figure out what settings are wrong [#611](https://github.com/Microsoft/vscode-arduino/issues/611)

## Version 0.2.19

- Release date: July 31, 2018

### Changed
- Dependency upgrade

## Version 0.2.18

- Release date: July 17, 2018

### Added
- Add Wio 3G board and WeMos D1 board [#223](https://github.com/Microsoft/vscode-arduino/pull/223)

### Fixed
- Fix IntelliSense issue of `c_cpp_properties.json`
- Fix "Verifying" is misspelled issue [#591](https://github.com/Microsoft/vscode-arduino/issues/591)
- Improve config setting descriptions [#605](https://github.com/Microsoft/vscode-arduino/issues/605)

Special thanks to [Takashi Matsuoka](https://github.com/matsujirushi), [Andrew Churchill](https://github.com/xxaxdxcxx), [Pharap](https://github.com/Pharap), thank you for your contributions and feedbacks.

## Version 0.2.17

- Release date: June 15, 2018

### Fixed
- Fix errors that frequently happened [#555](https://github.com/Microsoft/vscode-arduino/issues/555)
- Check Arduino IDE in command palette when cannot resolve arduino path [#583](https://github.com/Microsoft/vscode-arduino/issues/583)
- Fix g++ not find issue when upgrade the board sdk to a new version [#586](https://github.com/Microsoft/vscode-arduino/issues/586)

## Version 0.2.16

- Release date: June 6, 2018

### Added
- Add a way to skip header file provider [#565](https://github.com/Microsoft/vscode-arduino/pull/565)

### Fixed
- Fix arduino example display an empty tab issue [#533](https://github.com/Microsoft/vscode-arduino/issues/533)
- Fix the error message when cannot resolve arduino path [#566](https://github.com/Microsoft/vscode-arduino/issues/566)

Special thanks to [Thad House](https://github.com/ThadHouse), [Carlos Gomez](https://github.com/Kurolox), [Johannes Henninger](https://github.com/jhenninger), thank you for your contributions and feedbacks.

## Version 0.2.15

- Release date: May 14, 2018

### Added
- Add a sketch file button in status bar to reset sketch file [#481](https://github.com/Microsoft/vscode-arduino/issues/481)
- Add loading status bar for verify and build command [#137](https://github.com/Microsoft/vscode-arduino/issues/137)
- Add `prebuild` support in `arduino.json` [#411](https://github.com/Microsoft/vscode-arduino/issues/411)
- Add upload using programmer command [#407](https://github.com/Microsoft/vscode-arduino/issues/407)
- Add ignore option for board detection notification [#495](https://github.com/Microsoft/vscode-arduino/issues/495)
- Add settings for disable/enable serial monitor TestingOpen [#530](https://github.com/Microsoft/vscode-arduino/issues/530)

### Fixed
- Fix IntelliSense issue of `c_cpp_properties.json` (preview) [#438](https://github.com/Microsoft/vscode-arduino/issues/438)

Special thanks to [Joel Santos](https://github.com/mundodisco8), [John](https://github.com/VashJuan), [mybayern1974](https://github.com/mybayern1974), [Maxime Paquatte](https://github.com/maxime-paquatte), [Joe Saavedra](https://github.com/jmsaavedra), [Kye Burchard](https://github.com/kyeb), [Laurent Haas - F6FVY](https://github.com/f6fvy), thank you for your feedbacks.

## Version 0.2.14

- Release date: May 4, 2018

### Fixed
- Fix install board command issue

## Version 0.2.13

- Release date: April 26, 2018

### Fixed
- Fix board manager package version issue [#520](https://github.com/Microsoft/vscode-arduino/issues/520)

### Added
- Add install board command

### Changed
- Disable auto popup get started page for IoT Devkit

## Version 0.2.12

- Release date: April 8, 2018

### Fixed
- Fix board manager and library manager issue with portable Arduino installation [#415](https://github.com/Microsoft/vscode-arduino/issues/415)
- Fix board type button issue [#483](https://github.com/Microsoft/vscode-arduino/issues/483)
- Fix absolute output folder path issue [#450](https://github.com/Microsoft/vscode-arduino/issues/450)
- Fix serial port line ending issue [#497](https://github.com/Microsoft/vscode-arduino/issues/497)
- Fix debugging issue with file path contains spaces [#428](https://github.com/Microsoft/vscode-arduino/issues/428)
- Fix board manager mixed up packages issue [#414](https://github.com/Microsoft/vscode-arduino/issues/414)

Special thanks to [Felix Uhl](https://github.com/iFreilicht), [emontnemery](https://github.com/emontnemery), [tsalinger](https://github.com/tsalinger), [Diego Medeiros](https://github.com/Medeirox), [vphuoc](https://github.com/vphuoc), [Nuno Sousa](https://github.com/nuno407), thank you for your feedbacks.

## Version 0.2.11

- Release date: March 7, 2018

### Fixed
- Fix the issue caused by VSCode breaking change of `workspace.findfiles` [#467](https://github.com/Microsoft/vscode-arduino/pull/467)

Special thanks to [GarethE](https://github.com/keyoke), thank you for your contributions and feedbacks.

## Version 0.2.10

- Release date: October 27, 2017

### Changed
- Adopt the new VSCode Debug API [#432](https://github.com/Microsoft/vscode-arduino/pull/432), [#435](https://github.com/Microsoft/vscode-arduino/pull/435)
- Popup the example view when detecting new device is connected [#431](https://github.com/Microsoft/vscode-arduino/pull/431)

## Version 0.2.8

- Release date: October 10, 2017

### Changed
- Thanks to [Matthew Simms](https://github.com/brndmg) that fixes the regression from the usage react-select control in the [PR#421](https://github.com/Microsoft/vscode-arduino/pull/421)

## Version 0.2.7

- Release date: September 29, 2017

### Changed
- Default baud rate from 9600 to 115200

## Version 0.2.6

- Release date: September 1, 2017

### Added
- Add usb native binaries for electron 1.7.3 to unblock vscode insider August version

### Fixed
- Fix html/md preview issue

## Version 0.2.5

- Release date: August 24, 2017

### Added
- Add settings for enabled/disable USB detection
- Add Arduino Example tree explorer viewlet
- Contribution from [DeqingSun](https://github.com/DeqingSun): Support multiple versions of Arduino on Mac [#375](https://github.com/Microsoft/vscode-arduino/pull/375)
- Contribution from [DeqingSun](https://github.com/DeqingSun): Add board support for STM32F1 with Arudino_STM32 [#377](https://github.com/Microsoft/vscode-arduino/pull/377)

### Changed
- Leverage the output path config to speedup upload/verify
- Fix USB detection issue during uploading [#371](https://github.com/Microsoft/vscode-arduino/pull/371), [372](https://github.com/Microsoft/vscode-arduino/pull/372)
- Contribution from [lialosiu](https://github.com/lialosiu): Fix encoding issue for non UTF-8 [#364](https://github.com/Microsoft/vscode-arduino/pull/364)
- Update the documents with the helps of
    - [eduherminio](https://github.com/Microsoft/vscode-arduino/pull/361)
    - [Atalanttore](https://github.com/Microsoft/vscode-arduino/pull/381),

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
- Lazy load the arduino extension on startup, only usb detection works in background, when it detects an arduino board, the extension will fully activate
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

- Release date: April 14, 2017

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
- Command Palette (F1) integration of frequently used commands (e.g. Verify, Upload...)
