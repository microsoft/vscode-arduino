# IntelliSense Autoconfiguration Branch
## Problem
This branch more or less adresses [these](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen) issues.

It implements a parser which parses the output from Arduino's build process to generate a very precise `c_cpp_properties.json` which in turn hopefully renders any user interaction with this file obsolete

## Branch Goals
### Build Output Parser
The parser which parses the relevant includes, defines, compiler paths and flags from Arduino's build output
### `c_cpp_properties.json` Generator
The generator takes the parser's output and transforms it into a valid `c_cpp_properties.json` file.

### Configuration Flags
Provide a configuration flag which allows the user to turn this feature off - this is useful for the cases in which this magic fails or the user has a very specific setup. Although this branch tries to eliminate most of the latter cases.

### Global Tasks in vscode-arduino
Places where `c_cpp_properties.json` gets altered (list in progress)
```
src/extension.ts
  260, 53: arduinoContextModule.default.arduinoApp.tryToUpdateIncludePaths();
src/arduino/arduino.ts
  328, 12:     public tryToUpdateIncludePaths() {

```

### Status

|      | Tasks   |
|-----:|:--------|
| **Build output parser**               | :heavy_check_mark: Basic parser working* |
|                                       | :white_check_mark: Support for different boards |
|                                       | :white_check_mark: X-platform support |
| **`c_cpp_properties.json` generator** | :heavy_check_mark: Basic objects* |
|                                       | :heavy_check_mark: Basic setting of parsing result* |
|                                       | :heavy_check_mark: Basic file input*  |
|                                       | :heavy_check_mark: Basic file output* |
|                                       | :white_check_mark: Merging of parsing result and existing file content |
| **Configuration flags**               | :white_check_mark: |
| **Unit tests**                        | :white_check_mark: Basic parser |
|                                       | :white_check_mark: JSON input |
|                                       | :white_check_mark: JSON output |
|                                       | :white_check_mark: Configuration merging |
| **General**                           | :white_check_mark: Review and remove previous attempts messing with `c_cpp_properties.json` |
* not committed to branch yet

## Motivation
I write a lot of code for Arduino, especially libraries. The Arduino IDE is not suited for more complex projects and I tried several alternatives. The old and dysfunctional Arduino CDT extension for eclipse somehow stalled (even if it was promising), Sloeber could be an option but the maintainer is disillusioned and the project is more or less dead. Platform IO IDE's license is very [restrictive](https://community.platformio.org/t/what-part-of-platformio-is-open-source-licenced/1447/2).

Then remains vscode-arduino. It seems that it isn't completely dead - but almost. Most of the core functionality seems to work (I used it a few days now). But the biggest show stopper is the bad IntelliSense support.

## Beer Money :beers:
You can chip in some beer money to keep me motivated - this is really appreciated.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PVLCSRZHBJ28G&source=url)

<!-- https://github.com/patharanordev/donate-in-git -->
I will list every supporter here, thanks!

### Supporters
5$ -> 1 :beer:
1h coding -> 20$ -> 4 :beers:
2020-02-04 Elektronik Workshop: 32 :beers: (8h coding)
2020-02-05 Elektronik Workshop: 40 :beers: (10h coding)

<!-- https://github.com/StylishThemes/GitHub-Dark/wiki/Emoji -->

## Useful Links
* [IntelliSense issues on vscode-arduino](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen)
* [`c_cpp_properties.json` reference](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference)
* [Interactive regex debugger](https://regex101.com/)
* [Git branch management](https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/)

## Future Work
* Proper interactive serial terminal (this is the second major show stopper in my opinion)
* Lots of redundant code
  * e.g. "upload is a superset of "verify"
  * general lack of modularity - the above is the result
* It seems that this extension is pretty chaotic. Most probably some refactoring is necessary.

----

## Implementation

### Settings
Global user settings, on linux under `~/.config/Code/User/settings.json`, for instance:
```json
{
    "arduino.additionalUrls": "",
    "arduino.logLevel": "verbose",
    "C_Cpp.default.cppStandard": "c++11",
    "C_Cpp.default.cStandard": "c11",
    "arduino.disableTestingOpen": true,
    "workbench.editor.enablePreview": false
}
```
Project settings in `.vscode/arduino.json`
```
{
    "board": "arduino:avr:nano",
    "configuration": "cpu=atmega328old",
    "sketch": "examples/lcdpong-butenc/lcdpong-butenc.ino",
    "port": "/dev/ttyUSB0"
}
```
