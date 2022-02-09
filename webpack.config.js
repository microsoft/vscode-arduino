'use strict';

const path = require('path');
const cp = require('child_process');
const fs = require('fs-plus');

function getEntry() {
  const entry = {};
  const npmListRes = cp.execSync('npm list -only prod -json', {
    encoding: 'utf8'
  });
  const mod = JSON.parse(npmListRes);
  const unbundledModule = ['impor', 'uuid',
  // usb-native modules can not be bundled
  'usb-detection', '@serialport', 'bindings', 'serialport'];
  
  for (const mod of unbundledModule) {
    const p = 'node_modules/' + mod;
    fs.copySync(p, 'out/node_modules/' + mod);
  }

  // The nan module is nested inside usb-detection, so it was already copied.
  const noEntryModules = unbundledModule.concat(['nan']);
  const list = getDependenciesFromNpm(mod);
  const moduleList = list.filter((value, index, self) => {
    // Some entries in the list of unbundled modules are really namespaces, so
    // we do a prefix match to see if the module should be excluded. This isn't
    // perfect, but works for the set of modules we care about.
    return self.indexOf(value) === index && noEntryModules.filter(m => value.startsWith(m)).length === 0 && !/^@types\//.test(value);
  });

  for (const mod of moduleList) {
    entry[mod] = './node_modules/' + mod;
  }

  return entry;
}

function getDependenciesFromNpm(mod) {
  let list = [];
  const deps = mod.dependencies;
  if (!deps) {
    return list;
  }
  for (const m of Object.keys(deps)) {
    list.push(m);
    list = list.concat(getDependenciesFromNpm(deps[m]));
  }
  return list;
}

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node',
    
    entry: getEntry(),
    output: {
        path: path.resolve(__dirname, 'out/node_modules'),
        filename: '[name].js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    externals: {
        vscode: "commonjs vscode",
        serialport: "serialport"
    },
    resolve: {
        extensions: ['.js', '.json']
    }
}

module.exports = config;