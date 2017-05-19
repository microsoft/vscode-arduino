import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ArduinoApp } from "../arduino/arduino";
import { ArduinoSettings } from "../arduino/arduinoSettings";
import { BoardManager } from "../arduino/boardManager";
import * as platform from "../common/platform";
import * as util from "../common/util";
import { DeviceContext } from "../deviceContext";

export class DebuggerManager {
  private _usbDector;
  private _debugServerPath: string;
  private _miDebuggerPath: string;
  private _debuggerMappings: any = {};
  private _debuggerBoardMappings: any = {};
  private _arduinoSettings: ArduinoSettings;
  private _boardManager: BoardManager;

  constructor(
      private _extensionRoot: string,
    ) {
  }

  public initialize() {
    this._arduinoSettings = ArduinoApp.instance.settings;
    this._boardManager = ArduinoApp.instance.boardManager;
    const debugFileContent = fs.readFileSync(path.join(this._extensionRoot, "misc", "debuggerUsbMapping.json"), "utf8");
    const usbFileContent = fs.readFileSync(path.join(this._extensionRoot, "misc", "usbmapping.json"), "utf8");

    for (const _debugger of JSON.parse(debugFileContent)) {
      if (Array.isArray(_debugger.pid)) {
        for (const pid of _debugger.pid) {
          this._debuggerMappings[`${pid}%${_debugger.vid}`] = { ..._debugger, pid, vid: _debugger.vid };
        }
      } else {
        this._debuggerMappings[`${_debugger.pid}%${_debugger.vid}`] = { ..._debugger, pid: _debugger.pid, vid: _debugger.vid };
      }
    }
    for (const config of JSON.parse(usbFileContent)) {
      for (const board of config.boards) {
        if (board.interface || board.target) {
          this._debuggerBoardMappings[[board.package, board.architecture, board.id].join(":")] = board;
        }
      }
    }
    this._usbDector = require("../../../vendor/node-usb-native").detector;
    this._debugServerPath = platform.findFile(platform.getExecutableFileName("openocd"),
      path.join(this._arduinoSettings.packagePath, "packages"));
    if (!util.fileExistsSync(this._debugServerPath)) {
      this._debugServerPath = "";
    }

    this._miDebuggerPath = platform.findFile(platform.getExecutableFileName("arm-none-eabi-gdb"),
      path.join(this._arduinoSettings.packagePath, "packages"));
    if (!util.fileExistsSync(this._miDebuggerPath)) {
      this._miDebuggerPath = "";
    }
  }
  public get initialized(): boolean {
    return !!this._usbDector;
  }
  public get miDebuggerPath(): string {
    return this._miDebuggerPath;
  }

  public get debugServerPath(): string {
    return this._debugServerPath;
  }

  public async listDebuggers(): Promise<any[]> {
    const usbDeviceList = await this._usbDector.find();
    const keys = [];
    const results = [];
    usbDeviceList.forEach((device) => {
      if (device.vendorId && device.productId) {
        /* tslint:disable:max-line-length*/
        const key = util.convertToHex(device.productId, 4) + "%" + util.convertToHex(device.vendorId, 4);
        const relatedDebugger = this._debuggerMappings[key];
        if (relatedDebugger && keys.indexOf(key) < 0) {
          keys.push(key);
          results.push(relatedDebugger);
        }
      }
    });
    return results;
  }

  public async resolveOpenOcdOptions(config): Promise<string> {
    const board = this._boardManager.currentBoard.key;
    const debugConfig = this._debuggerBoardMappings[board];
    const dc = DeviceContext.getIntance();
    const debuggerConfiged: string = dc.debugger_;
    if (!debugConfig) {
      throw new Error(`Debug for board ${this._boardManager.currentBoard.name} is not supported by now.`);
    }
    let resolvedDebugger;
    const debuggers = await this.listDebuggers();
    if (!debuggers.length) {
      throw new Error(`No supported debuggers are connected.`);
    }
    // rule 1: if this board has debuggers, use its own debugger
    if (debugConfig.interface) {
      resolvedDebugger = debuggers.find((_debugger) => {
        return _debugger.short_name === debugConfig.interface || _debugger.config_file === debugConfig.interface;
      });
      if (!resolvedDebugger) {
        throw new Error(`Debug port for board ${this._boardManager.currentBoard.name} is not connected.`);
      }
    }
    // rule 2: if there is only one debugger, use the only debugger
    if (!resolvedDebugger && !debuggerConfiged && debuggers.length === 1) {
      resolvedDebugger = debuggers[0];
    }

    // rule 3: if there is any configuration about debugger, use this configuration
    if (!resolvedDebugger && debuggerConfiged) {
      resolvedDebugger = debuggers.find((_debugger) => {
        return _debugger.short_name === debuggerConfiged || _debugger.config_file === debuggerConfiged;
      });
    }
    if (!resolvedDebugger) {
      const chosen = await vscode.window.showQuickPick(<vscode.QuickPickItem[]>debuggers.map((l): vscode.QuickPickItem => {
        return {
          description: `(0x${l.vid}:0x${l.pid})`,
          label: l.name,
        };
      }).sort((a, b): number => {
        return a.label === b.label ? 0 : (a.label > b.label ? 1 : -1);
      }), { placeHolder: "Select a debugger" });
      if (chosen && chosen.label) {
        resolvedDebugger = debuggers.find((_debugger) =>  _debugger.name === chosen.label);
        if (resolvedDebugger) {
          dc.debugger_ = resolvedDebugger.config_file;
        }
      }
      if (!resolvedDebugger) {
        return "";
      }
    }

    const debugServerPath = config.debugServerPath;
    let scriptsFolder = path.join(path.dirname(debugServerPath), "../scripts/");
    if (!util.directoryExistsSync(scriptsFolder)) {
      scriptsFolder = path.join(path.dirname(debugServerPath), "../share/openocd/scripts/");
    }
    if (!util.directoryExistsSync(scriptsFolder)) {
      throw new Error("Cannot find scripts folder from openocd.");
    }
    if (resolvedDebugger.config_file.includes("jlink")) {
      // only swd is supported now
      return `-s ${scriptsFolder} -f interface/${resolvedDebugger.config_file} -c "transport select swd" -f target/${debugConfig.target}`;
    }
    return `-s ${scriptsFolder} -f interface/${resolvedDebugger.config_file} -f target/${debugConfig.target}`;
  }
}
