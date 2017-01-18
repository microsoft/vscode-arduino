//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Arduino Extension Tests", () => {

    test('should be present', () => {
		assert.ok(vscode.extensions.getExtension('Microsoft.vscode-arduino'));
	});
    
	test('should activate the extension', function (done) {
		this.timeout(1 * 60 * 1000);
		return vscode.extensions.getExtension('Microsoft.vscode-arduino').activate().then((api) => {
			done();
		});
	});
});
