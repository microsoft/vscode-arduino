//var SegfaultHandler = require('segfault-handler');
//SegfaultHandler.registerHandler();

var index = require('../package.json');

if (global[index.name] && global[index.name].version === index.version) {
    module.exports = global[index.name];
} else {
    var detection = require('./bindings');
    var EventEmitter2 = require('eventemitter2').EventEmitter2;

    var detector = new EventEmitter2({
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    });

    //detector.find = detection.find;
    detector.find = function (vid, pid, callback) {
        // Suss out the optional parameters
        if (!pid && !callback) {
            callback = vid;
            vid = undefined;
        } else if (!callback) {
            callback = pid;
            pid = undefined;
        }


        return new Promise(function (resolve, reject) {
            // Assemble the optional args into something we can use with `apply`
            var args = [];
            if (vid) {
                args = args.concat(vid);
            }
            if (pid) {
                args = args.concat(pid);
            }

            // Tack on our own callback that takes care of things
            args = args.concat(function (err, devices) {

                // We call the callback if they passed one
                if (callback) {
                    callback.call(callback, err, devices);
                }

                // But also do the promise stuff
                if (err) {
                    reject(err);
                    return;
                }
                resolve(devices);
            });

            // Fire off the `find` function that actually does all of the work
            detection.find.apply(detection, args);
        });
    };

    detection.registerAdded(function (device) {
        detector.emit('add:' + device.vendorId + ':' + device.productId, device);
        detector.emit('insert:' + device.vendorId + ':' + device.productId, device);
        detector.emit('add:' + device.vendorId, device);
        detector.emit('insert:' + device.vendorId, device);
        detector.emit('add', device);
        detector.emit('insert', device);

        detector.emit('change:' + device.vendorId + ':' + device.productId, device);
        detector.emit('change:' + device.vendorId, device);
        detector.emit('change', device);
    });

    detection.registerRemoved(function (device) {
        detector.emit('remove:' + device.vendorId + ':' + device.productId, device);
        detector.emit('remove:' + device.vendorId, device);
        detector.emit('remove', device);

        detector.emit('change:' + device.vendorId + ':' + device.productId, device);
        detector.emit('change:' + device.vendorId, device);
        detector.emit('change', device);
    });

    var started = true;

    detector.startMonitoring = function () {
        if (started) {
            return;
        }

        started = true;
        detection.startMonitoring();
    };

    detector.stopMonitoring = function () {
        if (!started) {
            return;
        }

        started = false;
        detection.stopMonitoring();
    };

    detector.version = index.version;
    global[index.name] = detector;

    module.exports = detector;
}