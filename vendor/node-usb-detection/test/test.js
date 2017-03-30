/*eslint-env node, mocha */

var Promise = require('bluebird');

var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var chalk = require('chalk');

// The plugin to test
var usbDetect = require('../');


function once(eventName) {
	return new Promise(function(resolve) {
		usbDetect.on(eventName, function(device) {
			resolve(device);
		});
	});
}


// We just look at the keys of this device object
var deviceObjectFixture = {
	locationId: 0,
	vendorId: 5824,
	productId: 1155,
	deviceName: 'Teensy USB Serial (COM3)',
	manufacturer: 'PJRC.COM, LLC.',
	serialNumber: '',
	deviceAddress: 11
};



describe('usb-detection', function() {
	var testDeviceShape = function(device) {
		expect(device)
			.to.have.all.keys(deviceObjectFixture)
			.that.is.an('object');
	};

	describe('`.find`', function() {

		var testArrayOfDevicesShape = function(devices) {
			expect(devices.length).to.be.greaterThan(0);
			devices.forEach(function(device) {
				testDeviceShape(device);
			});
		};

		it('should find some usb devices', function(done) {
			usbDetect.find(function(err, devices) {
				testArrayOfDevicesShape(devices);
				expect(err).to.equal(undefined);
				done();
			});
		});

		it('should return a promise', function() {
			return expect(usbDetect.find()
				.then(function(devices) {
					testArrayOfDevicesShape(devices);
				}))
				.to.eventually.be.fulfilled;
		});
	});


	describe('Events `.on`', function() {

		it('should listen to device add/insert', function(done) {
			console.log(chalk.black.bgCyan('Add/Insert a USB device'));
			once('add')
				.then(function(device) {
					testDeviceShape(device);
					done();
				});
		});

		it('should listen to device remove', function(done) {
			console.log(chalk.black.bgCyan('Remove a USB device'));
			once('remove')
				.then(function(device) {
					testDeviceShape(device);
					done();
				});
		});

		it('should listen to device change', function(done) {
			console.log(chalk.black.bgCyan('Add/Insert or Remove a USB device'));
			once('change')
				.then(function(device) {
					testDeviceShape(device);
					done();
				});
		});
	});


	after(function() {
		// After this call, the process will be able to quit
		usbDetect.stopMonitoring();
	});

});
