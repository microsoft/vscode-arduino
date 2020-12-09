import * as vscode from "vscode";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./arduinoSettings";
import { IBoard, IPlatform, IProgrammer } from "./package";

export class ProgrammerManager {
    public static notFoundDisplayValue: string = "<Select Programmer>";

    private _programmerValue: string;
    private _programmerDisplayName: string;

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
        return this._settings.useArduinoCli ? this._programmerValue : this.getPlatform + this._programmerValue;
    }

    public get currentDisplayName(): string {
        return this._programmerDisplayName;
    }

    /**
     * Select a programmer from the list of available programmers
     * Set the programmer value in device context
     * List format: programmer_name:friendly_name
     */
    public async selectProgrammer() {
        const selectionItems = this.getAvailableProgrammers(this._arduinoApp.boardManager.currentBoard).map(
            (programmer) => ({
                label: programmer.displayName,
                description: programmer.name,
                programmer }));
        const chosen = await vscode.window.showQuickPick(selectionItems, {
            placeHolder: "Select programmer",
        });
        if (!chosen) {
            return;
        }

        this.setProgrammerValue(chosen.programmer.name);
        DeviceContext.getInstance().programmer = chosen.programmer.name;
    }

    private setProgrammerValue(programmerKey: string | null) {
        this._programmerValue = programmerKey;
        this._programmerDisplayName = this._programmerValue
            ? this.getDisplayName(this._programmerValue)
            : ProgrammerManager.notFoundDisplayValue;
        this._programmerStatusBar.text = this._programmerDisplayName;
    }

    private getDisplayName(programmerKey: string): string {
        const programmer = this._arduinoApp.boardManager.installedProgrammers.get(programmerKey);
        return programmer ? programmer.displayName : programmerKey;
    }

    private getPlatform(programmerKey: string): IPlatform {
        const programmer = this._arduinoApp.boardManager.installedProgrammers.get(programmerKey);
        return programmer.platform;
    }

    private getAvailableProgrammers(currentBoard: IBoard): IProgrammer[] {
        if (!currentBoard || !currentBoard.platform) {
            return [];
        }

        // Filter the list of all programmers to those that share the same platform as the board
        const availableProgrammers: IProgrammer[] = [];
        for (const programmer of this._arduinoApp.boardManager.installedProgrammers.values()) {
            if (programmer.platform === currentBoard.platform) {
                availableProgrammers.push(programmer);
            }
        }

        return availableProgrammers;
    }
}
