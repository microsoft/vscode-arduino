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
        "arduino:avrisp": "AVR ISP",
        "arduino:avrispmkii": "AVRISP mkII",
        "arduino:usbtinyisp": "USBtinyISP",
        "arduino:arduinoisp": "ArduinoISP",
        "arduino:usbasp": "USBasp",
        "arduino:parallel": "Parallel Programmer",
        "arduino:arduinoasisp": "Arduino as ISP",
        "arduino:usbGemma": "Arduino Gemma",
        "arduino:buspirate": "BusPirate as ISP",
        "arduino:stk500": "Atmel STK500 development board",
        "arduino:jtag3isp": "Atmel JTAGICE3 (ISP mode)",
        "arduino:jtag3": "Atmel JTAGICE3 (JTAG mode)",
        "arduino:atmel_ice": "Atmel-ICE (AVR)",
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
        let prefix = "";
        if (!this._settings.useArduinoCli) {
            prefix = "arduino:"};
        this._programmervalue = prefix + programmer;
        this._programmerStatusBar.text = this._programmervalue
            ? this.getFriendlyName(this._programmervalue)
            : "<Select Programmer>";
    }

    private getFriendlyName(programmer: string): string {
        const friendlyName = this._availableProgrammers[programmer];
        return friendlyName ? friendlyName : programmer;
    }
}
