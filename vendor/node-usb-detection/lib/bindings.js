'use strict';

const bindings = require('./native_loader').load(__dirname + '/native', 'detection')

module.exports = {
    registerAdded: bindings.registerAdded,
    registerRemoved: bindings.registerRemoved,
    startMonitoring: bindings.startMonitoring,
    stopMonitoring: bindings.stopMonitoring,
    find: bindings.find
};