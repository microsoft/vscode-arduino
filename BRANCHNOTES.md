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

### Status
**2020-02-05** Currently I'm able to generate error free IntelliSense setups for AVR and ESP32 using the preliminary implementation. For ESP32 I just had to add the intrinsic compiler paths manually. A solution has to be found for these ... which there is, see [here](https://stackoverflow.com/a/6666338)
**2020-02-06** Got it fully working (with built-in include directories) for AVR, ESP32, ESP8266. Rewrote the backend to facilitate writing of further parser engines in the future.
**2020-02-07** Wrote compiler command parser npm package [cocopa](https://www.npmjs.com/package/cocopa) and began writing a test framework for it. Added a global configuration switch which allows the IntelliSense configuration generation to be turned off.
**2020-02-08** Integrated `cocopa` into vscode-arduino. Added project configuration flag which can override the global flag in both ways (forced off, forced on). Made code tslint compliant. Began some documentation in [README.md](README.md). vscode-arduino now tries to generate an IntelliSense configuration even if compilation (verify) should fail. vscode-arduino now tries to generate a IntelliSense configuration even if Arduino's verify failed (if the main sketch compilation was invoked before anything failed)
**2020-02-09** Moved vscode-arduino specific from cocopa over (to keep cocopa as generic as possible). More unit testing within cocopa. Some research regarding future serial monitor implementation. Implemented c_cpp_properties merging -> compiler analysis results are merged into existing configuration and will preserve configurations of different name than the vscode-studio default configuration name (currently "Arduino"). This opens up the possibility for users to write their own configurations without having to disable the autogeneration. Implemented "write on change" - `c_cpp_properties.json` will only be written if a new configuration has been detected. Now loads of tests have to be written for cocopa.


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
|                                       | :heavy_check_mark: Merging of parsing result and existing file content |
|                                       | :heavy_check_mark: Handling inexistent files and folders |
|                                       | :heavy_check_mark: Write configuration on change only |
|                                       | :white_check_mark: Option to backup old configurations? |
| **Configuration flags**               | :heavy_check_mark: Provide global disable flag for IntelliSense auto-config |
|                                       | :heavy_check_mark: Provide project specific override for the global flag - most users will likely use the default setup and disable auto-generation for very specific projects |
| **Unit tests**                        | :heavy_check_mark: Basic parser (known boards, match/no match)|
|                                       | :white_check_mark: All unit tests in cocopa |
|                                       | :white_check_mark: Test with cpp sketches |
| **General**                           | :white_check_mark: Review and remove previous attempts messing with `c_cpp_properties.json` or IntelliSense. (Partially done - documented in the [General Tasks](#General-Tasks) section |
|                                       | :white_check_mark: Auto-run verify after a) *setting a board* b) *changing the sketch* c) *workbench initialized and no `c_cpp_properties.json` has been found*. We have to generate a valid `c_cpp_properties.json` to keep IntelliSense working in such situations. Identify other occasions where this applies (usually when adding new libraries), hint the user to run *verify*? -> Good moment would be after the workbench initialization -> message in arduino channel |
|                                       | :heavy_check_mark: Document configuration settings in [README.md](README.md) |
|                                       | :white_check_mark: Document features in [README.md](README.md) (partially done) |
|                                       | :heavy_check_mark: Try to auto-generate even if verify (i.e. compilation) fails |
|                                       | :heavy_check_mark: Extract compiler command parser from vscode-arduino and [publish](https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c) it as a separate package which will allow reusage and easy testing without heavy vscode-arduino rucksack. Done, see [cocopa](https://www.npmjs.com/package/cocopa) |
|                                       | :white_check_mark: Parser only works when arduino is set to `verbose`, since this is the only way we get the compiler invocation command. This has to be fixed. |
|                                       | :white_check_mark: Finally: go through my code and look for TODOs |

`*` not committed to branch yet
`>` most of the actual parsing and configuration generation is part of [cocopa](https://github.com/elektronikworkshop/cocopa/) ([here](https://www.npmjs.com/package/cocopa)'s the npm package)

## Motivation
I write a lot of code for Arduino, especially libraries. The Arduino IDE is not suited for more complex projects and I tried several alternatives:
* The old and dysfunctional Arduino CDT extension for eclipse somehow stalled (even if it was promising)
* Sloeber could be an option but the maintainer is disillusioned and the project is more or less dead. Furthermore Eclipse is pretty heavy and less accessible to beginners
* Platform IO IDE's license is very [restrictive](https://community.platformio.org/t/what-part-of-platformio-is-open-source-licenced/1447/2).

Then remains vscode-arduino. It seems that it isn't completely dead - but almost. Most of the core functionality seems to work (I used it a few days now). But the biggest show stopper is the bad IntelliSense support -- which I'll address here now.

## Beer Money :beers:
You can chip in some beer money to keep me motivated - this is really appreciated.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PVLCSRZHBJ28G&source=url)

<!-- https://github.com/patharanordev/donate-in-git -->
I will list every supporter here, thanks!

### Supporters
5$ -> 1 :beer:
1h coding -> 20$ -> 4 :beers: (very moderate wage though)
2020-02-04 Elektronik Workshop: 32 :beers: (8h coding)
2020-02-05 Elektronik Workshop: 40 :beers: (10h coding)
2020-02-06 Elektronik Workshop: 36 :beers: (9h coding)
2020-02-07 Elektronik Workshop: 48 :beers: (12h coding)
2020-02-08 Elektronik Workshop: 52 :beers: (13h coding)
2020-02-09 Elektronik Workshop: 40 :beers: (10h coding)
2020-02-10 Elektronik Workshop: 32 :beers: (8h coding)

<!-- https://github.com/StylishThemes/GitHub-Dark/wiki/Emoji -->

## Useful Links
* [IntelliSense issues on vscode-arduino](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen)
* [`c_cpp_properties.json` reference](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference)
* [Interactive regex debugger](https://regex101.com/)
* [Git branch management](https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/)
* [Collapsible Markdown](https://gist.githubusercontent.com/joyrexus/16041f2426450e73f5df9391f7f7ae5f/raw/f774f242feff6bae4a5be7d6c71aa5df2e3fcb0e/README.md)
* [Arduino CLI manpage](https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc)

## Issues Concerning this Project
 * https://github.com/Microsoft/vscode-cpptools/issues/1750
 * Problems with IntelliSense itself https://github.com/microsoft/vscode-cpptools/issues/1034
 * Logging for IntelliSense https://code.visualstudio.com/docs/cpp/enable-logging-cpp
## Future Work
* Proper interactive serial terminal (this is the second major show stopper in my opinion)
  * Command history option
  * From https://github.com/microsoft/vscode-arduino/issues/463#issuecomment-583846263 and following:
    * Allow input on the serial monitor in a convenient way - ie just type and hit return, just like the Arduino IDE
    * Have the serial monitor window NOT keep turning off autoscroll (there is a separate ticket for this)
    * Have the option of the serial monitor and/or compile window auto clear each time the sketch is compiled
    * There is the annoying default where the compile runs in verbose mode and we have to manually edit config files to turn off the trace output
    * Is there a way to automatically select the right serial port?
    * Oh and one more. I want the serial output and perhaps compile windows to be undocked or at least I want them to sit to the right of my code window but they seem rigidly stuck at the bottom of the screen.
    * And I would probably prioritize ease of use over better editing/intelligence.
  * Being able to set baud rate within monitor
  * Possible implementation hooks
    * run node program in native terminal and connect it to extension
      * https://github.com/serialport/node-serialport
        * [General](https://serialport.io/docs/guide-about)
        * [CLI](https://serialport.io/docs/guide-cli)
        * [API](https://serialport.io/docs/guide-usage)
    * write a [debugger extension](https://code.visualstudio.com/api/extension-guides/debugger-extension) with a [mock](https://github.com/Microsoft/vscode-mock-debug) which communicates with the serial
* Lots of redundant code
  * e.g. "upload is a superset of "verify"
  * general lack of modularity - the above is the result
* It seems that this extension is pretty chaotic. Most probably some refactoring is necessary.
* Possibility to jump to compilation errors from compiler output and highlight compiler errors
----

## How to beta test cutting edge code from the repo

*I wrote the follwing for @iFreilicht, if anyone has some additional findings please let me know to keep this documentation up to date*

that's the reason I embarked on this project. Great if you'd like to help out - this comes in really handy. Getting the stuff rock solid is one of my central objectives and testing is one cornerstones here.

Currently my work is at the following state:
* Parsing works
* Enable/disable via global or project flags
* You can have personal configurations which aren't overwritten

But I'm not fully there yet. Things which are yet to be done are:

* Move the parser/configuration-generator out of the "verify" code, since it requires the build to be run with `--verbose` flag enabled which most probably few like (except for me :) I always switch on all warnings and set it to verbose).
  This is something I can implement pretty fast
* I have not removed the original "IntelliSense configurator" which ruins the `c_cpp_properties.json` every now and then but that's one of my next tasks as well. And you can simply delete the file as you can re-generate the perfect version with my analyzer/generator by simply verifying your sketch 
* My development system runs on Ubuntu-GNU/linux and I haven't done any work for Windows yet but that's one of the next steps. The chances that it works on OSX "out of the box" are pretty good

To run the development version clone my [repository](https://github.com/elektronikworkshop/vscode-arduino) and checkout the `intellisense-autoconfig` branch

The following steps requires you to have `git`, `vscode`, `npm` and `nodejs` at recent versions. On my Ubuntu system I don't use the versions supplied by my package manager (`apt`) as they are usually pretty outdated - I usually install `nodejs` and `npm` from their respective/official websites. If you're on Windows you'll have to be a bit more patient since I haven't set up a virtual machine yet for testing and Windows is definitely not my domain. But I'll document the setup process as soon as I'll get to it.

```bash
git clone https://github.com/elektronikworkshop/vscode-arduino
cd vscode-arduino
# switch to the feature branch (not necessary probably because this branch is set to default)
git checkout intellisense-autoconfig
# check if you're on the right branch
git status
# install module dependencies
npm install
# install gulp builder globally to make it available to the path (requires relaunching your shell)
npm install -g gulp
# to make sure that gulp is actually working type
gulp --tasks
# if not -> configure your $PATH and open a new terminal to make sure it's added, then
# open vscode
code .
```
Making sure that gulp  is on your `$PATH` is essential. As long this isn't the case the following steps must not be carried out.

Then hit F5 to debug or select it from the *Debug* menu. vscode will then complain that there's *No task defined* and you let it generate the configuration for you by clicking the button *Configure Task*. After configuring the tasks debug (`F5`) or build (`Ctrl + Shift + B`) should work.

As soon as you've got it up and running (`F5` spawns a new window), just navigate to your Arduino project. Configure in the vscode-arduino global settings the build output to `verbose` and run verify (`Ctrl + Alt + R`) as you know it. This will then generate a fresh `c_cpp_properties.json`. As long as I haven't removed the generator from the current maintainers you'll have to regenerate it as soon as you see those double asterisk-paths like `whatever/path/**` - if I get to it today, I'll give it a try and will remove/disable it for testing. You can then pull my changes in by running
```bash
git pull
```
from within your terminal inside vscode (and your `vscode-arduino` folder).

Different IntelliSense configurations can be selected in vscode in the lower right. The configuration my branch generates is called *Arduino* as depicted here:

![74001156-cfce8280-496a-11ea-9b9d-7d30c83765c1](https://user-images.githubusercontent.com/21954933/74351237-2696ea80-4db7-11ea-9f7a-1bfc652ad5f5.png)

Sometimes IntelliSense has problems within the extension host (which you're running when launching it with `F5`) and fails to resolve some header paths. This is a problem of vscode and not the extension. Then just restart. The extension host is a bit buggy if you ask me, so I hope I can provide some development snapshots in the future which will render all the steps above superfluous and let you run the latest development version with your regular vscode.

----

## Implementation
**Note** Check this vscode feature:
```
Configuration provider
The ID of a VS Code extension that can provide IntelliSense configuration information for source files. For example, use the VS Code extension ID ms-vscode.cmake-tools to provide configuration information from the CMake Tools extension.
```

### Build Output Parser
#### Intrinsic Include Paths
Some include paths are built into gcc and don't have to be specified on the command line. Just searching the compiler installation directory with something like
```bash
find  ~/.arduino15/packages/esp32/tools/xtensa-esp32-elf-gcc/1.22.0-80-g6c4433a-5.2.0/ -name "include*"
```
won't do since not all include directories are named `include`. Fortunately gcc can be queried about its configuration ([source](https://stackoverflow.com/a/6666338)) -- built-in include paths are part of it:
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
#### Global Settings
Under linux at `~/.config/Code/User/settings.json`, for instance:
```json
{
    "arduino.additionalUrls": "",
    "arduino.logLevel": "verbose",
    "arduino.disableTestingOpen": true,
    "workbench.editor.enablePreview": false
}
```
Code: [src/arduino/arduinoSettings.ts](src/arduino/arduinoSettings.ts)
Code: [src/arduino/vscodeSettings.ts](src/arduino/vscodeSettings.ts)
Validator: [package.json](package.json)

#### Project Settings
Path in project `.vscode/arduino.json`
```json
{
  "board": "arduino:avr:nano",
  "configuration": "cpu=atmega328old",
  "sketch": "examples/lcdpong-butenc/lcdpong-butenc.ino",
  "port": "/dev/ttyUSB0"
}
```
Code: [src/deviceContext.ts](src/deviceContext.ts)
Validator: [misc/arduinoValidator.json](misc/arduinoValidator.json)

### General Tasks
#### Removing existing Attempts which mess with c_cpp_properties.json or Intellisense

Remove these as they are helpless attempts to get IntelliSense working:
```ts
//src/arduino/arduino.ts
  tryToUpdateIncludePaths()
  addLibPath(libraryPath: string)
  getDefaultForcedIncludeFiles()
  // parts in
  openExample()

  //probably not needed anymore:
  getDefaultPackageLibPaths()

```
Remove this as this messes in an unpredictable and helpless way with Intellisense
[src/langService/completionProvider.ts](src/langService/completionProvider.ts)

Remove this folder as this is not necessary when Intellisense works properly:
```
syntaxes/
```
