import * as assert from 'assert';
import fs from 'fs';
import path from 'path';
import nodeunit from '../lib/nodeunit.js';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));


let setup = function (fn) {
		return async function (test) {
				process.chdir(__dirname);
				let env = {
						mock_module1: await import('./fixtures/mock_module1.js'),
						mock_module2: await import('./fixtures/mock_module2.js'),
						mock_module3: await import('./fixtures/dir/mock_module3.js'),
						mock_module4: await import('./fixtures/dir/mock_module4.js')
				};
				fn.call(env, test);
		};
};


export const testRunFiles = setup(function (test) {
		test.expect(33);
		let runModule_copy = nodeunit.runModule;

		let runModule_calls = [];
		let modules = [];

		let opts = {
				moduleStart: function () {
						return 'moduleStart';
				},
				testDone: function () {
						return 'testDone';
				},
				testReady: function () {
						return 'testReady';
				},
				testStart: function () {
						return 'testStart';
				},
				log: function () {
						return 'log';
				},
				done: function (assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 5, 'length');
						test.ok(typeof assertions.duration === "number");

						let called_with = function (name) {
								return runModule_calls.some(function (m) {
										return m.name === name;
								});
						};
						test.ok(called_with('mock_module1'), 'mock_module1 ran');
						test.ok(called_with('mock_module2'), 'mock_module2 ran');
						test.ok(called_with('mock_module3'), 'mock_module3 ran');
						test.ok(called_with('mock_module4'), 'mock_module4 ran');
						test.equals(runModule_calls.length, 5);

						nodeunit.runModule = runModule_copy;
						test.done();
				}
		};

		nodeunit.runModule = function (name, mod, options, callback) {
				test.equals(options.testDone, opts.testDone);
				test.equals(options.testReady, opts.testReady);
				test.equals(options.testStart, opts.testStart);
				test.equals(options.log, opts.log);
				test.ok(typeof name === "string");
				runModule_calls.push(mod);
				let m = [{failed: function () {
						return false;
				}}];
				modules.push(m);
				callback(null, m);
		};

		nodeunit.runFiles(
				[__dirname + '/fixtures/mock_module1.js',
				 __dirname + '/fixtures/mock_module2.js',
				 __dirname + '/fixtures/dir'],
				opts
		);
});

export const testRunFilesEmpty = function (test) {
		test.expect(3);
		nodeunit.runFiles([], {
				moduleStart: function () {
						test.ok(false, 'should not be called');
				},
				testDone: function () {
						test.ok(false, 'should not be called');
				},
				testReady: function () {
						test.ok(false, 'should not be called');
				},
				testStart: function () {
						test.ok(false, 'should not be called');
				},
				log: function () {
						test.ok(false, 'should not be called');
				},
				done: function (assertions) {
						test.equals(assertions.failures(), 0, 'failures');
						test.equals(assertions.length, 0, 'length');
						test.ok(typeof assertions.duration === "number");
						test.done();
				}
		});
};


export const testEmptyDir = function (test) {
		let dir2 = __dirname + '/fixtures/dir2';

		// git doesn't like empty directories, so we have to create one
		fs.access(dir2, function (err) {
				if (err) {
						fs.mkdirSync(dir2, parseInt('0777',8));
				}

				// runFiles on empty directory:
				nodeunit.runFiles([dir2], {
						moduleStart: function () {
								test.ok(false, 'should not be called');
						},
						testDone: function () {
								test.ok(false, 'should not be called');
						},
						testReady: function () {
								test.ok(false, 'should not be called');
						},
						testStart: function () {
								test.ok(false, 'should not be called');
						},
						log: function () {
								test.ok(false, 'should not be called');
						},
						done: function (assertions) {
								test.equals(assertions.failures(), 0, 'failures');
								test.equals(assertions.length, 0, 'length');
								test.ok(typeof assertions.duration === "number");
								test.done();
						}
				});
		});
};


// let CoffeeScript;
// try {
// 		CoffeeScript = require('coffee-script');
// 		if (CoffeeScript.register != null) {
// 				CoffeeScript.register();
// 		}
// } catch (e) {
// }

// export const testCoffeeScript = function (test) {
// 		process.chdir(__dirname);
// 		let env = {
// 				mock_coffee_module: require(__dirname +
// 																		'/fixtures/coffee/mock_coffee_module')
// 		};

// 		test.expect(10);
// 		let runModule_copy = nodeunit.runModule;

// 		let runModule_calls = [];
// 		let modules = [];

// 		let opts = {
// 				moduleStart: function () {
// 						return 'moduleStart';
// 				},
// 				testDone: function () {
// 						return 'testDone';
// 				},
// 				testReady: function () {
// 						return 'testReady';
// 				},
// 				testStart: function () {
// 						return 'testStart';
// 				},
// 				log: function () {
// 						return 'log';
// 				},
// 				done: function (assertions) {
// 						test.equals(assertions.failures(), 0, 'failures');
// 						test.equals(assertions.length, 1, 'length');
// 						test.ok(typeof assertions.duration === "number");

// 						let called_with = function (name) {
// 								return runModule_calls.some(function (m) {
// 										return m.name === name;
// 								});
// 						};
// 						test.ok(
// 								called_with('mock_coffee_15'),
// 								'mock_coffee_module ran'
// 						);
// 						test.equals(runModule_calls.length, 1);

// 						nodeunit.runModule = runModule_copy;
// 						test.done();
// 				}
// 		};

// 		nodeunit.runModule = function (name, mod, options, callback) {
// 				test.equals(options.testDone, opts.testDone);
// 				test.equals(options.testReady, opts.testReady);
// 				test.equals(options.testStart, opts.testStart);
// 				test.equals(options.log, opts.log);
// 				test.ok(typeof name === "string");
// 				runModule_calls.push(mod);
// 				let m = [{failed: function () {
// 						return false;
// 				}}];
// 				modules.push(m);
// 				callback(null, m);
// 		};

// 		nodeunit.runFiles(
// 				[__dirname + '/fixtures/coffee/mock_coffee_module.coffee'],
// 				opts
// 		);
// };
