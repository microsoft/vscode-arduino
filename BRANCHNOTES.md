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

### Status
|      | Tasks   |
|-----:|:--------|
| **Build output parser**               | :heavy_check_mark: Basic parser working (not committed yet) |
|                                       | :white_check_mark: Support for different boards             |
|                                       | :white_check_mark: X-platform support                       |
| **`c_cpp_properties.json` generator** | :white_check_mark: |
| **Configuration flags**               | :white_check_mark: |
| **Unit tests**                        | :white_check_mark: Basic parser |

## Motivation
I write a lot of code for Arduino, especially libraries. The Arduino IDE is not suited for more complex projects and I tried several alternatives. The old and dysfunct Arduino CDT extension for eclipse somehow stalled (even if it was promising), Sloeber could be an option but the maintainer is disillusioned and the project is more or less dead. Platform IO IDE's license is very [restrictive](https://community.platformio.org/t/what-part-of-platformio-is-open-source-licenced/1447/2).

Then remains vscode-arduino. It seems that it isn't completely dead - but almost. Most of the core functionality seems to work (I used it a few days now). But the biggest show stopper is the bad IntelliSense support.

## Beer Money
You can chip in some beer money to keep me motivated - this is really appreciated. 

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PVLCSRZHBJ28G&source=url)

<!-- https://github.com/patharanordev/donate-in-git -->

## Useful Links
* [IntelliSense issues on vscode-arduino](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen)
* [`c_cpp_properties.json` reference](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference)
* [Interactive regex debugger](https://regex101.com/)