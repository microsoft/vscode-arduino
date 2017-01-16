const glob = require('glob');
const _  = require('lodash');
const loadLibrary = function(parentFolder, libraryName) {
    const nodegypFiles = glob(`../build/(Release/Debug)/${libraryName}.node`, {sync: true});
    const nodepregypFiles = glob(`${parentFolder}/${libraryName}*${process.platform}*.node`, {sync: true});
    var binding = null;
    _.flatten([nodegypFiles, nodepregypFiles]).forEach(file => {
        try {
            var _temp = require(file);			
            binding = _temp;
            console.log('using', file);
        } catch( e) {			
        }
    });
    if (!binding) {
        console.log('[Warn]', 'no library available after trying files', files)
    }
    return binding;
};
exports.load = loadLibrary;
