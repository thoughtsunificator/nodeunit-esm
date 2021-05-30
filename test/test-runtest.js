/*  THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 *  You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 *  Only code on that line will be removed, its mostly to avoid requiring code
 *  that is node specific
 */

import nodeunit from '../lib/nodeunit.js'; // @REMOVE_LINE_FOR_BROWSER

export const testArgs = function (test) {
		test.ok(test.expect instanceof Function, 'test.expect');
		test.ok(test.done instanceof Function, 'test.done');
		test.ok(test.ok instanceof Function, 'test.ok');
		test.ok(test.same instanceof Function, 'test.same');
		test.ok(test.equals instanceof Function, 'test.equals');
		test.done();
};

export const testDoneCallback = function (test) {
		test.expect(4);
		nodeunit.runTest('testname', testArgs, {
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 5, 'length');
						test.ok(typeof assertions.duration === "number");
						test.equals(name, 'testname');
				}
		}, test.done);
};

export const testThrowError = function (test) {
		test.expect(3);
		let err = new Error('test');
		let testfn = function (test) {
				throw err;
		};
		nodeunit.runTest('testname', testfn, {
				log: function (assertion) {
						test.same(assertion.error, err, 'assertion.error');
				},
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 1);
						test.equals(assertions.length, 1);
				}
		}, test.done);
};
