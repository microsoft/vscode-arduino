import * as vscode from "vscode";
import * as constants from "../common/constants";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./arduinoSettings";
import { ArduinoSettings } from "./arduinoSettings";

export enum ProgrammerList {
    "AVR ISP",
    "AVRISP mkII",
    "USBtinyISP",
    "ArduinoISP",
    "ArduinoISP.org",
    "USBasp",
    "Parallel Programmer",
    "Arduino as ISP",
    "Arduino Gemma",
    "BusPirate as ISP",
    "Atmel STK500 development board",
    "Atmel JTAGICE3 (ISP mode)",
    "Atmel JTAGICE3 (JTAG mode)",
    "Atmel-ICE (AVR)",
}

export class ProgrammerManager {

    private static _programmerManager: ProgrammerManager = null;

    private _currentprogrammer: ProgrammerList;

    private _programmervalue: string;

    private _programmerStatusBar: vscode.StatusBarItem;

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._programmerStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants.statusBarPriority.PROGRAMMER);
        this._programmerStatusBar.command = "arduino.selectProgrammer";
        this._programmerStatusBar.tooltip = "Select Programmer";
        this._programmerStatusBar.text = "<Select Programmer>";
        this._programmerStatusBar.show();
    }

    public get currentProgrammer(): string {
        return this._programmervalue;
    }

    public async selectProgrammer() {
        const chosen: string | undefined = await vscode.window.showQuickPick(Object.keys(ProgrammerList)
            .filter((key) => {
                return !isNaN(Number(ProgrammerList[key]));
            }), { placeHolder: "Select programmer" });
        if (!chosen) {
            return;
        }
        this._currentprogrammer = ProgrammerList[chosen];
        this.getProgrammer(this._currentprogrammer);
        this._programmerStatusBar.text = chosen;
    }

    public getProgrammer(newProgrammer: ProgrammerList) {
        switch (newProgrammer) {
            case ProgrammerList["AVR ISP"]:
                this._programmervalue = "arduino:avrisp";
                break;
            case ProgrammerList["AVRISP mkII"]:
                this._programmervalue = "arduino:avrispmkii";
                break;
            case ProgrammerList.USBtinyISP:
                this._programmervalue = "arduino:usbtinyisp";
                break;
            case ProgrammerList.ArduinoISP:
                this._programmervalue = "arduino:arduinoisp";
                break;
            case ProgrammerList.USBasp:
                this._programmervalue = "arduino:usbasp";
                break;
            case ProgrammerList["Parallel Programmer"]:
                this._programmervalue = "arduino:parallel";
                break;
            case ProgrammerList["Arduino as ISP"]:
                this._programmervalue = "arduino:arduinoasisp";
                break;
            case ProgrammerList["Arduino Gemma"]:
                this._programmervalue = "arduino:usbGemma";
                break;
            case ProgrammerList["BusPirate as ISP"]:
                this._programmervalue = "arduino:buspirate";
                break;
            case ProgrammerList["Atmel STK500 development board"]:
                this._programmervalue = "arduino:stk500";
                break;
            case ProgrammerList["Atmel JTAGICE3 (ISP mode)"]:
                this._programmervalue = "arduino:jtag3isp";
                break;
            case ProgrammerList["Atmel JTAGICE3 (JTAG mode)"]:
                this._programmervalue = "arduino:jtag3";
                break;
            case ProgrammerList["Atmel-ICE (AVR)"]:
                this._programmervalue = "arduino:atmel_ice";
                break;
            default:
                break;
        }
    }
}
