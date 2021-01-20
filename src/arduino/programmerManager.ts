import * as vscode from "vscode";
import * as constants from "../common/constants";
import { DeviceContext } from "../deviceContext";
import { ArduinoApp } from "./arduino";
import { IArduinoSettings } from "./arduinoSettings";
import { IBoard, IProgrammer } from "./package";

export class ProgrammerManager {
    public static notFoundDisplayValue: string = "<Select Programmer>";

    private _programmerValue: string;
    private _programmerDisplayName: string;

    private _programmerStatusBar: vscode.StatusBarItem;

    constructor(private _settings: IArduinoSettings, private _arduinoApp: ArduinoApp) {
        this._programmerStatusBar = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            constants.statusBarPriority.PROGRAMMER,
        );
        this._programmerStatusBar.command = "arduino.selectProgrammer";
        this._programmerStatusBar.tooltip = "Select Programmer";
        this.setProgrammerValue(DeviceContext.getInstance().programmer);
        this._programmerStatusBar.show();
        DeviceContext.getInstance().onChangeProgrammer(() => {
            this.setProgrammerValue(DeviceContext.getInstance().programmer);
        });
    }

    public get currentProgrammer(): string {
        return this._programmerValue;
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
        DeviceContext.getInstance().programmer = this._programmerValue;
    }

    private setProgrammerValue(programmerName: string | null) {
        const programmer = this._arduinoApp.boardManager.installedProgrammers.get(programmerName);
        this._programmerValue = this._settings.useArduinoCli ? programmerName : programmer ? programmer.key : programmerName;
        this._programmerDisplayName = this._programmerValue
            ? this.getDisplayName(programmerName)
            : ProgrammerManager.notFoundDisplayValue;
        this._programmerStatusBar.text = this._programmerDisplayName;
    }

    private getDisplayName(programmerName: string): string {
        const programmer = this._arduinoApp.boardManager.installedProgrammers.get(programmerName);
        return programmer ? programmer.displayName : programmerName;
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
