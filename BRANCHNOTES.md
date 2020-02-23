# IntelliSense Autoconfiguration Branch
## Problem
This branch more or less addresses the following issues:
| # | Issue | Title | Comment |
|--:|:------|:------------|:--------|
|  1| [#438](https://github.com/microsoft/vscode-arduino/issues/438) | **The Extension should automagically fill the `c_cpp_properties.json`, so intellisense works out of the box** | This is the issue to which I usually report news concerning the progress of this project |
|  2| [#969](https://github.com/microsoft/vscode-arduino/issues/969) | **INO Files defines undefined but can jump to definition**  |  |
|  3| [#959](https://github.com/microsoft/vscode-arduino/issues/959) | **Update board type command does not update intellisense config automatically**  |  |
|  4| [#892](https://github.com/microsoft/vscode-arduino/issues/892) | **Default IntelliSense config** |  |
|  5| [#876](https://github.com/microsoft/vscode-arduino/issues/876) | **Missing #define ARDUINO 10808 logic?** | Marked as bug but it's just the same problem again |
|  6| [#850](https://github.com/microsoft/vscode-arduino/issues/850) | **How to prevent modifications of `c_cpp_properties.json` by the extension?**  | Asks if the current implementation can be turned off, because it overwrites a user's config with non working IS config -- this is sad. |
|  7| [#833](https://github.com/microsoft/vscode-arduino/issues/833) | **Allow C_Cpp.intelliSenseEngine to be set to "Default" instead of "Tag Parser" for better code completion/suggestions**  |  |
|  8| [#831](https://github.com/microsoft/vscode-arduino/issues/831) | **IntelliSenseEngine doesn't work as default** |  |
|  9| [#829](https://github.com/microsoft/vscode-arduino/issues/829) | **`Arduino.h` and ESP8266 includes have squiggles** | Stale issue |
| 10| [#823](https://github.com/microsoft/vscode-arduino/issues/823) | **Intellisense is not highlighting code** | Stale issue |
| 11| [#818](https://github.com/microsoft/vscode-arduino/issues/818) | **Warning with default includePath after initialize, cannot open source file `avr/pgmspace.h`** | Stale issue |
| 12| [#808](https://github.com/microsoft/vscode-arduino/issues/808) | **Identifier `Serial` is undefined**  |  |
| 13| [#776](https://github.com/microsoft/vscode-arduino/issues/776) | **Can not open source file `omp.h` (dependency of `ESP8266WiFi.h`** |  |
| 14| [#772](https://github.com/microsoft/vscode-arduino/issues/772) | **How to fix red squiggles under constants like D2 (upload works fine)** |  |
| 15| [#761](https://github.com/microsoft/vscode-arduino/issues/761) | **When creating the `c_cpp_properties.json` it should include the libraries folder as well as all of the other folders.** |  |
| 16| [#749](https://github.com/microsoft/vscode-arduino/issues/749) | **Non-fatal error on Adafruit Feather M0: cannot open source file `sam.h`** | Stale issue |
| 17| [#727](https://github.com/microsoft/vscode-arduino/issues/727) | **Intellisense for Arduino Tabs** | Stale issue |
| 18| [#684](https://github.com/microsoft/vscode-arduino/issues/684) | **Default C/C++ configuration uses MSVC for IntelliSense rather than GCC** | Stale issue |
| 19| [#678](https://github.com/microsoft/vscode-arduino/issues/678) | **Dependency error `avr32/io.h`** | Stale issue |
| 20| [#645](https://github.com/microsoft/vscode-arduino/issues/645) | **Should IntelliSense suggest only built in function?** | Stale issue |
| 21| [#613](https://github.com/microsoft/vscode-arduino/issues/613) | **Read content of `keywords.txt` for text highlights** | This will become obsolete as well since `keywords.txt` is a dirty workaround for the arduino IDE which doesn't have IntelliSense at all. |
| 22| [#563](https://github.com/microsoft/vscode-arduino/issues/563) | **Support of intellisence for library Wire(sam)** |  |
| 23| [#525](https://github.com/microsoft/vscode-arduino/issues/525) | **`#include` errors detected - Tag Parser.** | Closed but still not fixed properly |
| 24| [#474](https://github.com/microsoft/vscode-arduino/issues/474) | **Enrich device develop experience**  |  |
| 25| [#127](https://github.com/microsoft/vscode-arduino/issues/127) | **Syntax highlighting for some of the Classes/Instances is missing** | Closed but still not fixed properly |
| 26| [#126](https://github.com/microsoft/vscode-arduino/issues/126) | **Syntax highlighting for some of the Macros is missing** | Closed but still not fixed properly |
| 27| [#125](https://github.com/microsoft/vscode-arduino/issues/125) | **Missing syntax highlighting for partial arduino constants** | Closed but still not fixed properly |
| 28| [#115](https://github.com/microsoft/vscode-arduino/issues/115) | **Dot prompting the methods doesn't work on Mac** | Closed but still not fixed properly |

<!-- |   | [#](https://github.com/microsoft/vscode-arduino/issues/) | **** |  | -->
<!-- |   | [#](https://github.com/microsoft/vscode-arduino/issues/) | **** |  | -->
<!-- |   | [#](https://github.com/microsoft/vscode-arduino/issues/) | **** |  | -->
<!-- |   | [#](https://github.com/microsoft/vscode-arduino/issues/) | **** |  | -->

-- the list is probably incomplete - I didn't search exhaustively and didn't consider closed issues as long as I didn't stumble upon one. New duplicates are popping up at a rate of about one per week.

Some issue searches and other related issues
* [vscode-arduino issue search for IntelliSense](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=intellisense+is%3Aopen)
* [vscode-arduino issue search for intellisense label](https://github.com/microsoft/vscode-arduino/issues?utf8=%E2%9C%93&q=label%3Aintellisense)
* [Wrongly attributed to vscode instead of vscode-arduino](https://github.com/Microsoft/vscode-cpptools/issues/1750)
* [Problems with IntelliSense itself](https://github.com/microsoft/vscode-cpptools/issues/1034)

## Solution
Implement and add a a parser which parses the output from Arduino's build process and generate a very precise `c_cpp_properties.json` which in turn hopefully renders any user interaction with this file obsolete.

This mechanism should try it's best to detect situations in which the setup changes (board changed, sketch changed and so forth) and re-generate this configuration. For all other situations I'll provide a command to manually re-generate it.

## Branch Goals
### Build Output Parser
The parser which identifies the main compilation command from Arduino's build output. It then parses the relevant includes, defines, compiler paths and flags from it.

### `c_cpp_properties.json` Generator
The generator takes the parser's output and transforms it into a valid `c_cpp_properties.json` file. It merges the generated configuration with the existing (e.g. user-) configurations and writes it back to the configuration file.

### Configuration Flags
Provide a global configuration flag which allows the user to turn this feature off. A project- (sketch-) specific override will be provided which allows the user to turn it off or on - regardless of the global setting.
This is useful for the rare cases for which this magic should fail or the user has a very exotic setup. This branch tries to eliminate most of the latter cases though. Especially it will always write to the `Arduino` configuration. If the user sets up a custom configuration she/he must simply name it differently, e.g. `John's Custom Config`, and the generator won't touch it.

### Global Tasks in vscode-arduino
* Integrate it into vscode-arduino's build mechanics
* Install event trigger generation/handling to run the analysis as soon as something changes
* Remove the current implementation
For more details see table below.

## Branch Log
**2020 02 05** Currently I'm able to generate error free IntelliSense setups for AVR and ESP32 using the preliminary implementation. For ESP32 I just had to add the intrinsic compiler paths manually. A solution has to be found for these ... which there is, see [here](https://stackoverflow.com/a/6666338)
**2020 02 06** Got it fully working (with built-in include directories) for AVR, ESP32, ESP8266. Rewrote the backend to facilitate writing of further parser engines in the future.
**2020 02 07** Wrote compiler command parser npm package [cocopa](https://www.npmjs.com/package/cocopa) and began writing a test framework for it. Added a global configuration switch which allows the IntelliSense configuration generation to be turned off.
**2020 02 08** Integrated `cocopa` into vscode-arduino. Added project configuration flag which can override the global flag in both ways (forced off, forced on). Made code tslint compliant. Began some documentation in [README.md](README.md). vscode-arduino now tries to generate an IntelliSense configuration even if compilation (verify) should fail. vscode-arduino now tries to generate a IntelliSense configuration even if Arduino's verify failed (if the main sketch compilation was invoked before anything failed)
**2020 02 09** Moved vscode-arduino specific from cocopa over (to keep cocopa as generic as possible). More unit testing within cocopa. Some research regarding future serial monitor implementation. Implemented c_cpp_properties merging -> compiler analysis results are merged into existing configuration and will preserve configurations of different name than the vscode-studio default configuration name (currently "Arduino"). This opens up the possibility for users to write their own configurations without having to disable the autogeneration. Implemented "write on change" - `c_cpp_properties.json` will only be written if a new configuration has been detected. Now loads of tests have to be written for cocopa.
**2020 02 10-12** Worked primarily on cocopa and test cases, fixed some npm and build errors on vscode-arduino within my setup.
**2020 02 15** Merged `upload` `uploadUsingProgrammer` and `verify` into a single function since they shared mostly the same code
* Better readability
* Better maintainability
* Less code redundancy -> less code -> less bugs
* Keeps the calls to the Arduino build CLI at a single location

During merging I found some bugs within those functions - mainly due to the above problem. The most notable were:
* The serial monitor state wasn't restored when something went wrong
* In one of the `upload` functions the original authors forgot to invoke the "pre build command"
* Error message formatting was fixed within `verify` only
* No consistent return values within `verify` (when it bailed out early it returned `void`)

**2020 02 17** Disabled and marked all previous implementations of IntelliSense support for later removal using `IS-REMOVE`. Pulled changes from upstream and merged them into the intellisense feature branch. Began to work on event handling/generation: vscode-arduino should detect when sketch/board/configuration and so on has changed, then re-analyze the current setup and set the IntelliSense configuration accordingly. This works more or less but there's a lot to fix in the current implementation which kept me busy till late today (I need some sleep now). Cleanup and commits follow tomorrow. Approaching alpha version for curious testers. OSX and Linux comes first, Windows will follow later.
**2020 02 18** Finished basic event triggering. Rewrote `DeviceContext` for proper settings modification detection (trigger events only on actual change) and generation of setting specific events (e.g. board changed) instead of one global event (aka. "something in the settings changed").
**2020 02 19** Implemented proper build scheduling for analysis build by writing an `AnalysisManager` class. This class collects multiple changes (e.g. board and configuration, which often are changed shortly after another) before running an analysis. In case another build or analysis is in progress it postpones newly filed analysis requests until the other build has completed. Updated and completed the documentation for the IntelliSense usage within [README](README.md). Alpha test builds of the extension containing the latest implemented features and fixes are now available from the following [Dropbox folder](https://www.dropbox.com/sh/whmcdt26chyjgby/AAB1Ld2fzZ9Z_NfM3CRay17wa). Please note, that Windows is currently not supported yet. Reviewed, documented/commented all changes and committed the automatic analysis integration changes.
**2020 02 20** Windows support - what a PITA. This OS is so foobar'ed... The only positive outcome from this experience: I found some substantial bugs in the parser which - of course (Murphy) - didn't affect me up to now. The parser should be much more resistant against strange paths and escapes now: Added proper command line lexer to cocopa and worked around several ridiculous Windows shortcomings (Microsoft owes me at least 50 crates of beer). The whole mess is not cleaned up and committed yet so please don't build from the repository and use the alpha release packages as outlined above.
**2020 02 21** Discovered problems and bugs in the current official release from Microsoft: Fixed event handling within board manager. Added validity checks when loading board configurations from arduino.json. Better error handling and code locality, for details see commit.
**2020 02 22** Worked on cocopa unit tests: restored broken tests and added platform test for built-in parser. Added path normalizing for include paths for both cocopa and vscode-arduino. Verified correct behaviour on Windows with latest release (alpha tester claimed it not to be working)

## Status
|      | Tasks   |
|-----:|:--------|
| **Build output parser**               | :heavy_check_mark: Basic parser working |
|                                       | :heavy_check_mark: Support for different boards (done for AVR, ESP32, ESP8266) -- The code has been designed such that it is easy to write/add new parser engines (for non gcc compilers for instance) |
|                                       | :heavy_check_mark: Getting intrinsic gcc include paths |
|                                       | :heavy_check_mark: Handling quoted arguments |
|                                       | :heavy_check_mark: X-platform support |
| **`c_cpp_properties.json` generator** | :heavy_check_mark: Basic objects |
|                                       | :heavy_check_mark: Basic setting of parsing result |
|                                       | :heavy_check_mark: Basic file input  |
|                                       | :heavy_check_mark: Basic file output |
|                                       | :heavy_check_mark: Merging of parsing result and existing file content |
|                                       | :heavy_check_mark: Handling inexistent files and folders |
|                                       | :heavy_check_mark: Write configuration on change only |
| **Configuration flags**               | :heavy_check_mark: Provide global disable flag for IntelliSense auto-config |
|                                       | :heavy_check_mark: Provide project specific override for the global flag - most users will likely use the default setup and disable auto-generation for very specific projects |
| **Unit tests**                        | :heavy_check_mark: Basic parser (known boards, match/no match)|
|                                       | :white_check_mark: All unit tests in cocopa |
|                                       | :white_check_mark: Test with cpp sketches |
| **General**                           | :heavy_check_mark: Review and remove previous attempts messing with `c_cpp_properties.json` or IntelliSense (documented in the [General Tasks](#General-Tasks) section) `*` |
|                                       | :heavy_check_mark: *Auto-run verify when* |
|                                       | &nbsp;&nbsp;&nbsp;&nbsp;:heavy_check_mark: a) setting a board `*` |
|                                       | &nbsp;&nbsp;&nbsp;&nbsp;:heavy_check_mark: b) changing the board's configuration `*` |
|                                       | &nbsp;&nbsp;&nbsp;&nbsp;:heavy_check_mark: c) selecting another sketch `*` |
|                                       | &nbsp;&nbsp;&nbsp;&nbsp;:heavy_check_mark: d) ~~workbench initialized and no `c_cpp_properties.json` found~~ obsolete: when board and board configuration is loaded on start up the analysis is triggered anyways |
|                                       | &nbsp;&nbsp;&nbsp;&nbsp;:white_check_mark: e) Identify other occasions where this applies (usually when adding new libraries) -- any suggestions? |
|                                       | :heavy_check_mark: Hint the user to run *Arduino: Rebuild IntelliSense Configuration* -> printing message after each build (verify, upload, ...) |
|                                       | :heavy_check_mark: Better build management such that regular builds and analyze builds do not interfere (done, 2020-02-19) `*` |
|                                       | :heavy_check_mark: Analyze task queue which fits in the latter  (done, 2020-02-19) `*` |
|                                       | :heavy_check_mark: Document configuration settings in [README.md](README.md) |
|                                       | :heavy_check_mark: Document features in [README.md](README.md) |
|                                       | :heavy_check_mark: Try to auto-generate even if verify (i.e. compilation) fails |
|                                       | :heavy_check_mark: Extract compiler command parser from vscode-arduino and [publish](https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c) it as a separate package which will allow reusage and easy testing without heavy vscode-arduino rucksack -- done, see [cocopa](https://www.npmjs.com/package/cocopa) |
|                                       | :heavy_check_mark: Parser only works when arduino is set to `verbose`, since this is the only way we get the compiler invocation command - this has to be fixed (done, see next item) |
|                                       | :heavy_check_mark: Implement a *Rebuild IntelliSense Configuration* command which runs verify verbosely internally and therefore allows us to find and parse the compiler command |
|                                       | :heavy_check_mark: Implement proper event generation for `DeviceContext`. a) Events should be issued only when something actually changes, b) Events should be issued for each setting separately `*`|
|                                       | :white_check_mark: Finally: go through my code and look for TODOs |

`*` not committed to branch yet
`>` most of the actual parsing and configuration generation is part of [cocopa](https://github.com/elektronikworkshop/cocopa/) ([here](https://www.npmjs.com/package/cocopa)'s the npm package)

## Motivation
I write a lot of code for Arduino, especially libraries. The Arduino IDE is not suited for more complex projects and I tried several alternatives:
* The old and dysfunctional Arduino CDT extension for eclipse somehow stalled (even if it was promising)
* Sloeber could be an option but the maintainer is disillusioned and the project is more or less dead. Furthermore Eclipse is pretty heavy and less accessible to beginners
* Platform IO IDE's license is very [restrictive](https://community.platformio.org/t/what-part-of-platformio-is-open-source-licenced/1447/2).

Then remains vscode-arduino. It seems that it isn't completely dead - but almost. Most of the core functionality seems to work (I used it a few days now). But the biggest show stopper is the bad IntelliSense support -- which I'll address here now.

## Beer Money :beers: -- Support
You can chip in some beer money to keep me motivated - this is *really* appreciated.

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
2020-02-11 Elektronik Workshop: 16 :beers: (4h coding)
2020-02-12 Elektronik Workshop: 32 :beers: (8h coding)
2020-02-15 T.D.: 4 :beers: (20$ - Thanks a lot!)
2020-02-15 Elektronik Workshop: 28 :beers: (7h coding)
2020-02-17 Elektronik Workshop: 52 :beers: (13h coding)
2020-02-18 Elektronik Workshop: 36 :beers: (9h coding)
2020-02-19 Elektronik Workshop: 48 :beers: (12h coding)
2020-02-20 Elektronik Workshop: 56 :beers: (14h coding)
2020-02-21 Elektronik Workshop: 48 :beers: (12h coding)
2020-02-22 Elektronik Workshop: 44 :beers: (11h coding)

<!-- https://github.com/StylishThemes/GitHub-Dark/wiki/Emoji -->

## Useful Links
* [`c_cpp_properties.json` reference](https://code.visualstudio.com/docs/cpp/c-cpp-properties-schema-reference)
* [Interactive regex debugger](https://regex101.com/)
* [Git branch management](https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/)
* [Collapsible Markdown](https://gist.githubusercontent.com/joyrexus/16041f2426450e73f5df9391f7f7ae5f/raw/f774f242feff6bae4a5be7d6c71aa5df2e3fcb0e/README.md)
* [Arduino CLI manpage](https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc)
* [Install extensions from file](https://vscode-docs.readthedocs.io/en/stable/extensions/install-extension/)
* [Publish vscode extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
* [Debug logging for IntelliSense](https://code.visualstudio.com/docs/cpp/enable-logging-cpp)
* [Arduino Dev Tools](https://playground.arduino.cc/Main/DevelopmentTools/) (obsolete/outdated)

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
* Further IntelliSense enhancements/features:
  * When having adding a library folder to the workspace IntelliSense should use the same configuration for it to enable library navigation and code completion.
  * Optimization: Abort analysis build as soon as compiler statement has been found
* Non-IDE unit testing - to eliminate dependency injection use ts-mock-imports for instance
* Hardcoded and scattered constants:
  * Load package.json and use values from therein instead of hard coding redundant values like shortcuts (like I did for the IntelliSense message in `arduino.ts`)
  * Scan code for other hard coded stuff and take appropriate countermeasures

## Non-categorized Notes
### Integrate upstream changes into fork
```bash
git remote add upstream https://github.com/microsoft/vscode-arduino.git
git remote -v
git fetch upstream
# make sure your working directory is clean, then
git checkout master
git merge upstream/master
git push origin master
# to pull the changes into you feature branch:
git checkout intellisense-autoconfig
git merge master
git push origin intellisense-autoconfig
```
----

## How to beta test cutting edge code from the repo

For development and testing of this fork/branch I've set up a dedicated chat room:

[![Gitter](https://badges.gitter.im/vscode-arduino-ew-fork/community.svg)](https://gitter.im/vscode-arduino-ew-fork/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

**Note:** the topic is strictly development and testing of this feature enhancement branch. It's not a place where you can ask for help on your Arduino problems. There are dedicated forums for that and I'll delete any question of this type.


*I wrote the follwing for @iFreilicht, if anyone has some additional findings please let me know to keep this documentation up to date*

 > I'd love to try this out and give feedback. It would be a huge quality of life improvement if this was to work. Could you point me to a resource that helps me install your version of the extension?

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
# there's another option below, see ./launchcode.sh
npm install -g gulp
# to make sure that gulp is actually working type
gulp --tasks
# if not -> configure your $PATH and open a new terminal to make sure it's added, then
# open vscode
code .
```
Making sure that gulp  is on your `$PATH` is essential. As long this isn't the case the following steps must not be carried out.

Another option to launch code with gulp on your path is (within bash or similar)
```bash
# create launch script
echo "PATH=./node_modules/.bin:$PATH code ." > launchcode
# make it executable
chmod +x launchcode
# now you can launch vscode like this
./launchcode
```
This way you don't have to install gulp globally anymore (no `npm install -g gulp`). The path to the vscode dependency module binary is set as temporary environment variable when launching vscode.

When everything's fine and vscode running, hit F5 to debug or select it from the *Debug* menu. vscode will then complain that there's *No task defined* and you let it generate the configuration for you by clicking the button *Configure Task*. After configuring the tasks debug (`F5`) or build (`Ctrl + Shift + B`) should work.

As soon as you've got it up and running (`F5` spawns a new window), just navigate to your Arduino project. Configure in the vscode-arduino global settings the build output to `verbose` and run verify (`Ctrl + Alt + R`) as you know it. This will then generate a fresh `c_cpp_properties.json`. As long as I haven't removed the generator from the current maintainers you'll have to regenerate it as soon as you see those double asterisk-paths like `whatever/path/**` - if I get to it today, I'll give it a try and will remove/disable it for testing. You can then pull my changes in by running
```bash
git pull
```
from within your terminal inside vscode (and your `vscode-arduino` folder).

Different IntelliSense configurations can be selected in vscode in the lower right. The configuration my branch generates is called *Arduino* as depicted here:

![74001156-cfce8280-496a-11ea-9b9d-7d30c83765c1](https://user-images.githubusercontent.com/21954933/74351237-2696ea80-4db7-11ea-9f7a-1bfc652ad5f5.png)

Sometimes IntelliSense has problems within the extension host (which you're running when launching it with `F5`) and fails to resolve some header paths. This is a problem of vscode and not the extension. Then just restart. The extension host is a bit buggy if you ask me, so I hope I can provide some development snapshots in the future which will render all the steps above superfluous and let you run the latest development version with your regular vscode.

----

# Implementation
Here are some implementation notes. Probably only of interest to me.

## Build Output Parser
### Intrinsic Include Paths
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

## `c_cpp_properties.json` Generator


## Settings
### Global Settings
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

### Project Settings
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

## General Tasks
### Removing existing Attempts which mess with c_cpp_properties.json or Intellisense

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

Review this folder as some of this is probably obsolete when Intellisense works properly:
```
syntaxes/arduino.configuration.json
syntaxes/arduino.tmLanguage
# Within package.json
  {
    "language": "cpp",
    "path": "./syntaxes/arduino.tmLanguage",
    "scopeName": "source.cpp.arduino"
  },
```
