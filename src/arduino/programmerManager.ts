import * as vscode from "vscode";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./arduinoSettings";

export class ProgrammerManager {
    private _programmervalue: string;

    private _programmerStatusBar: vscode.StatusBarItem;

    // Static list of 'available' programmers.  This should be repopulated by the currently selected board type.
    private _availableProgrammers = {
        avrisp: "AVR ISP",
        avrispmkii: "AVRISP mkII",
        usbtinyisp: "USBtinyISP",
        arduinoisp: "ArduinoISP",
        usbasp: "USBasp",
        parallel: "Parallel Programmer",
        arduinoasisp: "Arduino as ISP",
        usbGemma: "Arduino Gemma",
        buspirate: "BusPirate as ISP",
        stk500: "Atmel STK500 development board",
        jtag3isp: "Atmel JTAGICE3 (ISP mode)",
        jtag3: "Atmel JTAGICE3 (JTAG mode)",
        atmel_ice: "Atmel-ICE (AVR)",
    };

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._programmerStatusBar = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            constants.statusBarPriority.PROGRAMMER,
        );
        this._programmerStatusBar.command = "arduino.selectProgrammer";
        this._programmerStatusBar.tooltip = "Select Programmer";
        this.setProgrammerValue(DeviceContext.getInstance().programmer);
        this._programmerStatusBar.show();
        DeviceContext.getInstance().onDidChange(() => {
            this.setProgrammerValue(DeviceContext.getInstance().programmer);
        });
    }

    public get currentProgrammer(): string {
        return this._programmervalue;
    }

    public async selectProgrammer() {
        const selectionItems = Object.keys(this._availableProgrammers).map(
            (programmer) => ({
                label: this.getFriendlyName(programmer),
                description: programmer,
                programmer }));
        const chosen = await vscode.window.showQuickPick(selectionItems, {
            placeHolder: "Select programmer",
        });
        if (!chosen) {
            return;
        }

        this.setProgrammerValue(chosen.programmer);
        const dc = DeviceContext.getInstance();
        dc.programmer = chosen.programmer;
    }

    private setProgrammerValue(programmer: string | null) {
        this._programmervalue = programmer;
        this._programmerStatusBar.text = this._programmervalue
            ? this.getFriendlyName(this._programmervalue)
            : "<Select Programmer>";
    }

    private getFriendlyName(programmer: string): string {
        const friendlyName = this._availableProgrammers[programmer];
        return friendlyName ? friendlyName : programmer;
    }
}
