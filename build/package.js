// Copyright (c) Microsoft Corporation.

const { execSync } = require("child_process");
const { mkdirSync, readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { argv } = require("process");

const flags = argv.slice(2).join(" ");

// Taken from https://code.visualstudio.com/api/working-with-extensions/publishing-extension#platformspecific-extensions
const platforms = [
  "win32-x64",
  // "win32-ia32", This is no longer supported by vscode based on the link above.
  "win32-arm64",
  "linux-x64",
  "linux-arm64",
  "linux-armhf",
  "alpine-x64",
  "alpine-arm64",
  "darwin-x64",
  "darwin-arm64",
];

// We include different files for each platform, so we need to build a custom
// .vscodeignore file based on common file and platform-specific path.
const ignoreFile = readFileSync(resolve(__dirname, "..", ".vscodeignore"), "utf8");
const customIgnoreFilePath = resolve(__dirname, "..", "out", ".vscodeignore");

execSync('npm run build', { cwd: resolve(__dirname, ".."), stdio: "inherit" });
mkdirSync(resolve(__dirname, "..", "out", "vsix"), { recursive: true });
for (const platform of platforms) {
  writeFileSync(
    customIgnoreFilePath,
    ignoreFile + `!assets/platform/${platform}/**`
  );
  const command = `vsce package --target ${platform} --out out/vsix/vscode-arduino-${platform}.vsix ${flags}`;
  execSync(command, {
    cwd: resolve(__dirname, ".."),
    stdio: "inherit",
  });
}
