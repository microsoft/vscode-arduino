# IntelliSense Autoconfiguration Branch
## Problem
This branch more or less addresses [these](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen) issues (about seven).

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
**2020-02-05** Currently I'm able to generate error free IntelliSense setups for AVR and ESP32 using the preliminary implementation. For ESP32 I just had to add the intrinsic compiler paths manually. A solution has to be found for these ... which there is, see [here](https://stackoverflow.com/a/6666338)  
**2020-02-06** Got it fully working (with built-in include directories) for AVR, ESP32, ESP8266. Rewrote the backend to facilitate writing of further parser engines in the future.
|      | Tasks   |
|-----:|:--------|
| **Build output parser**               | :heavy_check_mark: Basic parser working |
|                                       | :heavy_check_mark: Support for different boards (done for AVR, ESP32, ESP8266) -- The code has been designed such that it is easy to write/add new parser engines (for non gcc compilers for instance) |
|                                       | :heavy_check_mark: Getting intrinsic gcc include paths |
|                                       | :heavy_check_mark: Handling quoted arguments |
|                                       | :white_check_mark: X-platform support |
| **`c_cpp_properties.json` generator** | :heavy_check_mark: Basic objects |
|                                       | :heavy_check_mark: Basic setting of parsing result |
|                                       | :heavy_check_mark: Basic file input  |
|                                       | :heavy_check_mark: Basic file output |
|                                       | :white_check_mark: Merging of parsing result and existing file content |
|                                       | :white_check_mark: Handling inexistent files and folders |
| **Configuration flags**               | :white_check_mark: |
| **Unit tests**                        | :white_check_mark: Basic parser (known boards, match/no match)|
|                                       | :white_check_mark: Querying of compiler built-in includes |
|                                       | :white_check_mark: Throwing arbitrary data at parser engines |
|                                       | :white_check_mark: JSON input |
|                                       | :white_check_mark: JSON output |
|                                       | :white_check_mark: Configuration merging |
| **General**                           | :white_check_mark: Review and remove previous attempts messing with `c_cpp_properties.json` |
`*` not committed to branch yet

## Motivation
I write a lot of code for Arduino, especially libraries. The Arduino IDE is not suited for more complex projects and I tried several alternatives. The old and dysfunct Arduino CDT extension for eclipse somehow stalled (even if it was promising), Sloeber could be an option but the maintainer is disillusioned and the project is more or less dead. Platform IO IDE's license is very [restrictive](https://community.platformio.org/t/what-part-of-platformio-is-open-source-licenced/1447/2).

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
2020-02-06 Elektronik Workshop: 36 :beers: (9h coding)  

<!-- https://github.com/StylishThemes/GitHub-Dark/wiki/Emoji -->

## Useful Links
* [IntelliSense issues on vscode-arduino](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen)
* [`c_cpp_properties.json` reference](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference)
* [Interactive regex debugger](https://regex101.com/)
* [Git branch management](https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/)

## Future Work
* Proper interactive serial terminal (this is the second major show stopper in my opinion)
* Lots of redundand code
  * e.g. "upload is a superset of "verify"
  * general lack of modularity - the above is the result 
* It seems that this extension is pretty chaotic. Most probably some refactoring is necessary.

----

## Implementation

### Build Output Parser
#### Intrinsic Include Paths
Some include paths are built into gcc and don't have to be specified on the command line. This requires that we have to get them from the compiler.

Just searching the compiler installation directory with something like
```bash
find  ~/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/ -name "include*"
```
won't do since not all include directorys are named `include`. Fortunately gcc can be queried about its configuration ([source](https://stackoverflow.com/a/6666338)):
```bash
# generally for C++
gcc -xc++ -E -v -
# for esp32
~/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/xtensa-esp32-elf-gcc -xc++ -E -v - < /dev/null > xtensa-esp32-elf-gcc_built_in_specs.txt 2>&1
# avr
~/.arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin/avr-gcc -xc++ -E -v - < /dev/null > avr-gcc_built_in_specs.txt 2>&1
```
The result can be inspected here:
* [xtensa-esp32-elf-gcc_built_in_specs.txt](doc/intellisense/compilerinfo/xtensa-esp32-elf-gcc_built_in_specs.txt)
* [avr-gcc_built_in_specs.txt](doc/intellisense/compilerinfo/avr-gcc_built_in_specs.txt)
To show the most interesting section in the output of the above commands, for ESP32:
```
#include "..." search starts here:
#include <...> search starts here:
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../lib/gcc/xtensa-esp32-elf/5.2.0/../../../../xtensa-esp32-elf/include/c++/5.2.0
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../lib/gcc/xtensa-esp32-elf/5.2.0/../../../../xtensa-esp32-elf/include/c++/5.2.0/xtensa-esp32-elf
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../lib/gcc/xtensa-esp32-elf/5.2.0/../../../../xtensa-esp32-elf/include/c++/5.2.0/backward
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../lib/gcc/xtensa-esp32-elf/5.2.0/include
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../lib/gcc/xtensa-esp32-elf/5.2.0/include-fixed
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../lib/gcc/xtensa-esp32-elf/5.2.0/../../../../xtensa-esp32-elf/include
 /home/uli/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/bin/../xtensa-esp32-elf/sysroot/usr/include
End of search list.
```
for AVR:
```
#include "..." search starts here:
#include <...> search starts here:
 /home/uli/.arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin/../lib/gcc/avr/7.3.0/include
 /home/uli/.arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin/../lib/gcc/avr/7.3.0/include-fixed
 /home/uli/.arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino5/bin/../lib/gcc/avr/7.3.0/../../../../avr/include
End of search list.
```
As one can see with the ESP32-gcc not all include directories are named `include`. Parsing of this output is pretty trivial though.

### `c_cpp_properties.json` Generator


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

### Global Tasks in vscode-arduino
