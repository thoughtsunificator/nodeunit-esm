import nodeunit from '../lib/nodeunit.js';

export const testFailingLog = function (test) {
		test.expect(3);

		// this is meant to bubble to the top, and will be ignored for the purposes
		// of testing:
		let ignored_error = new Error('ignore this callback error');
		let err_handler = function (err) {
				if (err && err.message !== ignored_error.message) {
						throw err;
				}
		};
		process.addListener('uncaughtException', err_handler);

		// A failing callback should not affect the test outcome
		let testfn = function (test) {
				test.ok(true, 'test.ok');
				test.done();
		};
		nodeunit.runTest('testname', testfn, {
				log: function (assertion) {
						test.ok(true, 'log called');
						throw ignored_error;
				},
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 1, 'total');
						process.removeListener('uncaughtException', err_handler);
				}
		}, test.done);
};

export const testFailingTestDone = function (test) {
		test.expect(2);

		let ignored_error = new Error('ignore this callback error');
		let err_handler = function (err) {
				if (err && err.message !== ignored_error.message) {
						throw err;
				}
		};
		process.addListener('uncaughtException', err_handler);

		// A failing callback should not affect the test outcome
		let testfn = function (test) {
				test.done();
		};
		nodeunit.runTest('testname', testfn, {
				log: function (assertion) {
						test.ok(false, 'log should not be called');
				},
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 0, 'total');
						process.nextTick(function () {
								process.removeListener('uncaughtException', err_handler);
								test.done();
						});
						throw ignored_error;
				}
		}, function () {});
};

export const testAssertionObj = function (test) {
		test.expect(4);
		let testfn = function (test) {
				test.ok(true, 'ok true');
				test.done();
		};
		nodeunit.runTest('testname', testfn, {
				log: function (assertion) {
						test.ok(assertion.passed() === true, 'assertion.passed');
						test.ok(assertion.failed() === false, 'assertion.failed');
				},
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 1, 'total');
				}
		}, test.done);
};

export const testLogOptional = function (test) {
		test.expect(2);
		let testfn = function (test) {
				test.ok(true, 'ok true');
				test.done();
		};
		nodeunit.runTest('testname', testfn, {
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 1, 'total');
				}
		}, test.done);
};

export const testExpectWithFailure = function (test) {
		test.expect(3);
		let testfn = function (test) {
				test.expect(1);
				test.ok(false, 'test.ok');
				test.done();
		};
		nodeunit.runTest('testname', testfn, {
				log: function (assertion) {
						test.equals(assertion.method, 'ok', 'assertion.method');
				},
				testDone: function (name, assertions) {
						test.equals(assertions.failures(), 1, 'failures');
						test.equals(assertions.length, 1, 'total');
				}
		}, test.done);
};
