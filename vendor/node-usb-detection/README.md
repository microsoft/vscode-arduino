[![npm version](https://badge.fury.io/js/usb-detection.svg)](http://badge.fury.io/js/usb-detection)


# usb-detection

`usb-detection` allows you to listen for insert/remove events of USB devices on your system.


### [Changelog](https://github.com/MadLittleMods/node-usb-detection/blob/master/CHANGELOG.md)


# Install

```
npm install usb-detection
```

This assumes you also have everything on your system necessary to compile ANY native module for Node.js. This may not be the case, though, so please ensure the following requirements are satisfied before filing an issue about "Does not install". For all operating systems, please ensure you have Python 2.x installed AND not 3.0, [node-gyp](https://github.com/TooTallNate/node-gyp) (what we use to compile) requires Python 2.x.

### Windows:

 - Visual Studio 2013/2015 Community
 - Visual Studio 2010
 - Visual C++ Build Tools 2015: https://github.com/nodejs/node-gyp/issues/629#issuecomment-153196245

If you are having problems building, [please read this](https://github.com/TooTallNate/node-gyp/issues/44).

### Mac OS X:

Ensure that you have at a minimum, the xCode Command Line Tools installed appropriate for your system configuration. If you recently upgraded your OS, it probably removed your installation of Command Line Tools, please verify before submitting a ticket.

### Linux:

You know what you need for you system, basically your appropriate analog of build-essential. Keep rocking!

To compile and install native addons from npm you may also need to install build tools *([source](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager#debian-and-ubuntu-based-linux-distributions))*:

```
sudo apt-get install -y build-essential
```

Also install libudev:

```
sudo apt-get install libudev-dev
```


# Usage

```js
var usbDetect = require('usb-detection');

// Detect add/insert
usbDetect.on('add', function(device) { console.log('add', device); });
usbDetect.on('add:vid', function(device) { console.log('add', device); });
usbDetect.on('add:vid:pid', function(device) { console.log('add', device); });

// Detect remove
usbDetect.on('remove', function(device) { console.log('remove', device); });
usbDetect.on('remove:vid', function(device) { console.log('remove', device); });
usbDetect.on('remove:vid:pid', function(device) { console.log('remove', device); });

// Detect add or remove (change)
usbDetect.on('change', function(device) { console.log('change', device); });
usbDetect.on('change:vid', function(device) { console.log('change', device); });
usbDetect.on('change:vid:pid', function(device) { console.log('change', device); });

// Get a list of USB devices on your system, optionally filtered by `vid` or `pid`
usbDetect.find(function(err, devices) { console.log('find', devices, err); });
usbDetect.find(vid, function(err, devices) { console.log('find', devices, err); });
usbDetect.find(vid, pid, function(err, devices) { console.log('find', devices, err); });
// Promise version of `find`:
usbDetect.find().then(function(devices) { console.log(devices); }).catch(function(err) { console.log(err); });
```


# API

## `on(eventName, callback)`

 - `eventName`
 	 - `add`: also aliased as `insert`
 	 	 - `add:vid`
 	 	 - `add:vid:pid`
 	 - `remove`
 	 	 - `remove:vid`
 	 	 - `remove:vid:pid`
 	 - `change`
 	 	 - `change:vid`
 	 	 - `change:vid:pid`
 - `callback`: Function that is called whenever the event occurs
 	 - Takes a `device`


```js
var usbDetect = require('usb-detection');
usbDetect.on('add', function(device) {
	console.log(device);
});

/* Console output:
{
	locationId: 0,
	vendorId: 5824,
	productId: 1155,
	deviceName: 'Teensy USB Serial (COM3)',
	manufacturer: 'PJRC.COM, LLC.',
	serialNumber: '',
	deviceAddress: 11
}
*/
```


## `find(vid, pid, callback)`

**Note:** All `find` calls return a promise even with the node-style callback flavors.

 - `find()`
 - `find(vid)`
 - `find(vid, pid)`
 - `find(callback)`
 - `find(vid, callback)`
 - `find(vid, pid, callback)`

Parameters:

 - `vid`: restrict search to a certain vendor id
 - `pid`: restrict search to s certain product id
 - `callback`: Function that is called whenever the event occurs
 	 - Takes a `err` and `devices` parameter.


```js
var usbDetect = require('usb-detection');
usbDetect.find(function(err, devices) {
	console.log(devices, err);
});
// Equivalent to:
//		usbDetect.find().then(function(devices) { console.log(devices); }).catch(function(err) { console.log(err); });

/* Console output:
[
	{
		locationId: 0,
		vendorId: 0,
		productId: 0,
		deviceName: 'USB Root Hub',
		manufacturer: '(Standard USB Host Controller)',
		serialNumber: '',
		deviceAddress: 2
	},
	{
		locationId: 0,
		vendorId: 5824,
		productId: 1155,
		deviceName: 'Teensy USB Serial (COM3)',
		manufacturer: 'PJRC.COM, LLC.',
		serialNumber: '',
		deviceAddress: 11
	}
]
*/
```




# FAQ

### The script/process is not exiting/quiting

```js
var usbDetect = require('usb-detection');

// Do some detection

// After this call, the process will be able to quit
usbDetect.stopMonitoring();
```



# Testing

We have a suite of Mocha/Chai tests.

The tests require some manual interaction of plugging/unplugging a USB device. Follow the cyan background text instructions.

```sh
npm test
```
