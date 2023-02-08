// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// This script downloads and verifies platform-specific arduino-cli binaries
// from GitHub releases. The release is specified by the "version" field in
// assets.json.

const { execSync } = require("child_process");
const { createHash } = require("crypto");
const { readFileSync, mkdirSync, rmSync, renameSync } = require("fs");
const { resolve } = require("path");

function run(command) {
  console.log(command);
  execSync(command);
}

const config = require('./assets.json');

for (const asset in config.assets) {
  if (Object.hasOwnProperty.call(config.assets, asset)) {
    const platforms = config.assets[asset].platforms;
    const hash = config.assets[asset].hash;
    for (const platform of platforms) {
      const directory = resolve(__dirname, "..", "assets", "platform", platform);
      const destination = resolve(directory, asset);

      // Download the asset.
      run([
        "curl",
        `https://github.com/arduino/arduino-cli/releases/download/${config.version}/${asset}`,
        "--location",
        `--output-dir ${directory}`,
        `--remote-name`,
        "--silent",
        "--show-error",
      ].join(" "));

      // Verify the hash.
      const actualHash = createHash("sha256")
        .update(readFileSync(destination))
        .digest("hex");
      if (actualHash !== hash) {
        throw new Error(
          `Hash mismatch for ${asset} on ${platform}. Expected ${hash} but got ${actualHash}.`
        );
      }

      // Extract to an "arduino-cli" directory.
      const extractDirectory = resolve(directory, "arduino-cli");
      mkdirSync(extractDirectory, { recursive: true });
      // tar on Linux doesn't understand zip files.
      if (asset.endsWith(".zip") && process.platform === 'linux') {
        run(`unzip ${destination} -d ${extractDirectory}`);
      } else {
        run(`tar -xf ${destination} -C ${extractDirectory}`);
      }

      // Remove the downloaded archive. We don't need to ship it.
      rmSync(destination);

      // VSIX signing will silently strip any extensionless files. Artificially
      // add a ".app" extension to extensionless executables.
      const executable = resolve(extractDirectory, "arduino-cli");
      try {
        renameSync(executable, `${executable}.app`);
      } catch {
        // The file might not exist. This is expected for Windows.
      }
    }
  }
}
