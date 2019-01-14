import * as vscode from "vscode";

export class SerialPlotterPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: SerialPlotterPanel | undefined;

    public static createOrShow(html: string): SerialPlotterPanel {
        // If we already have a panel, show it.
        if (SerialPlotterPanel.currentPanel) {
            SerialPlotterPanel.currentPanel._panel.reveal();
            return SerialPlotterPanel.currentPanel;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel("arduinoSerialPlotter", "Arduino Serial Plottter", vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });

        panel.webview.html = html;

        SerialPlotterPanel.currentPanel = new SerialPlotterPanel(panel);

        return SerialPlotterPanel.currentPanel;
    }

    private readonly _panel: vscode.WebviewPanel;

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;

        this._panel.onDidDispose(() => this.dispose());
    }

    public postMessage(msg: {}): void {
        this._panel.webview.postMessage(msg);
    }

    public dispose(): void {
        SerialPlotterPanel.currentPanel = undefined;

        this._panel.dispose();
    }
}
