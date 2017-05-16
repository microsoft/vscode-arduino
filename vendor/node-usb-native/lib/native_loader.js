const glob = require('glob');
const path = require('path');
const loadLibrary = function(parentFolder, libraryName) {
  const nodegypFiles = glob(path.join(__dirname, `../build/+(Release|Debug)/${libraryName}.node`), {
    sync: true
  });
  console.log(`${parentFolder.replace(/\\/g, '/')}/${libraryName}*${process.platform}*.node`);
  const nodepregypFiles = glob(`${parentFolder.replace(/\\/g, '/')}/${libraryName}*${process.platform}*.node`, {
    sync: true
  });
  var binding = null;
  nodegypFiles.concat(nodepregypFiles).forEach((file) => {
    try {
      var _temp = require(file);
      binding = _temp;
      console.log('using', file);
    } catch (e) {
    }
  });
  if (!binding) {
    console.log('[Warn]', 'no library available after trying files', nodegypFiles.concat(nodepregypFiles));
  }
  return binding;
};
exports.load = loadLibrary;
