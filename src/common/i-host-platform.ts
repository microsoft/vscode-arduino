export interface IHostPlatform {
    resolveArduinoPath(useArduinoCli?: boolean): string | Promise<string> | undefined;
    validateArduinoPath(arduinoPath: string, useArduinoCli?: boolean);
    findFile(fileName: string, cwd: string): string;
    getExecutableFileName(fileName: string): string;
}