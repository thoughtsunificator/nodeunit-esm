/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 *
 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 * You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 * Only code on that line will be removed, it's mostly to avoid requiring code
 * that is node specific
 */

/**
 * Module dependencies
 */

import async from '../deps/async.js'; //@REMOVE_LINE_FOR_BROWSER
import * as nodeunit from './nodeunit.js';   //@REMOVE_LINE_FOR_BROWSER
import * as types from './types.js';       //@REMOVE_LINE_FOR_BROWSER


/**
 * Added for browser compatibility
 */

let _keys = function (obj) {
		if (Object.keys) {
				return Object.keys(obj);
		}
		let keys = [];
		for (let k in obj) {
				if (obj.hasOwnProperty(k)) {
						keys.push(k);
				}
		}
		return keys;
};


let _copy = function (obj) {
		let nobj = {};
		let keys = _keys(obj);
		for (let i = 0; i <  keys.length; i += 1) {
				nobj[keys[i]] = obj[keys[i]];
		}
		return nobj;
};


/**
 * Runs a test function (fn) from a loaded module. After the test function
 * calls test.done(), the callback is executed with an assertionList as its
 * second argument.
 *
 * @param {String} name
 * @param {Function} fn
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

export const runTest = function (name, fn, opt, callback) {
		let options = types.options(opt);

		options.testStart(name);
		let start = new Date().getTime();
		let test = types.test(name, start, options, callback);
		options.testReady(test);
		try {
				fn(test);
		}
		catch (e) {
				test.done(e);
		}
};

/**
 * Takes an object containing test functions or other test suites as properties
 * and runs each in series. After all tests have completed, the callback is
 * called with a list of all assertions as the second argument.
 *
 * If a name is passed to this function it is prepended to all test and suite
 * names that run within it.
 *
 * @param {String} name
 * @param {Object} suite
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

export const runSuite = function (name, suite, opt, callback) {
		suite = wrapGroup(suite);
		let keys = _keys(suite);

		async.concatSeries(keys, function (k, cb) {
				let prop = suite[k], _name;


				_name = name ? [].concat(name, k) : [k];
				_name.toString = function () {
						// fallback for old one
						return this.join(' - ');
				};

				if (typeof prop === 'function') {
						let in_name = false,
								in_specific_test = (_name.toString() === opt.testFullSpec) ? true : false;
						for (let i = 0; i < _name.length; i += 1) {
								if (_name[i] === opt.testspec) {
										in_name = true;
								}
						}

						if ((!opt.testFullSpec || in_specific_test) && (!opt.testspec || in_name)) {
								if (opt.moduleStart) {
										opt.moduleStart();
								}
								runTest(_name, suite[k], opt, cb);
						}
						else {
								return cb();
						}
				}
				else {
						runSuite(_name, suite[k], opt, cb);
				}
		}, callback);
};

/**
 * Run each exported test function or test suite from a loaded module.
 *
 * @param {String} name
 * @param {Object} mod
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

export const runModule = function (name, mod, opt, callback) {
		let options = _copy(types.options(opt));

		let _run = false;
		let _moduleStart = options.moduleStart;

		mod = wrapGroup(mod);

		function run_once() {
				if (!_run) {
						_run = true;
						_moduleStart(name);
				}
		}
		options.moduleStart = run_once;

		let start = new Date().getTime();

		runSuite(null, mod, options, function (err, a_list) {
				let end = new Date().getTime();
				let assertion_list = types.assertionList(a_list, end - start);
				options.moduleDone(name, assertion_list);
				if (nodeunit.complete) {
						nodeunit.complete(name, assertion_list);
				}
				callback(null, a_list);
		});
};

/**
 * Treats an object literal as a list of modules keyed by name. Runs each
 * module and finished with calling 'done'. You can think of this as a browser
 * safe alternative to runFiles in the nodeunit module.
 *
 * @param {Object} modules
 * @param {Object} opt
 * @api public
 */

// TODO: add proper unit tests for this function
export const runModules = function (modules, opt) {
		let all_assertions = [];
		let options = types.options(opt);
		let start = new Date().getTime();

		async.concatSeries(_keys(modules), function (k, cb) {
				runModule(k, modules[k], options, cb);
		},
		function (err, all_assertions) {
				let end = new Date().getTime();
				options.done(types.assertionList(all_assertions, end - start));
		});
};


/**
 * Wraps a test function with setUp and tearDown functions.
 * Used by testCase.
 *
 * @param {Function} setUp
 * @param {Function} tearDown
 * @param {Function} fn
 * @api private
 */

let wrapTest = function (setUp, tearDown, fn) {
		return function (test) {
				let context = {};
				if (tearDown) {
						let done = test.done;
						test.done = function (err) {
								try {
										tearDown.call(context, function (err2) {
												if (err && err2) {
														test._assertion_list.push(
																types.assertion({error: err})
														);
														return done(err2);
												}
												done(err || err2);
										});
								}
								catch (e) {
										done(e);
								}
						};
				}
				if (setUp) {
						setUp.call(context, function (err) {
								if (err) {
										return test.done(err);
								}
								fn.call(context, test);
						});
				}
				else {
						fn.call(context, test);
				}
		};
};


/**
 * Returns a serial callback from two functions.
 *
 * @param {Function} funcFirst
 * @param {Function} funcSecond
 * @api private
 */

let getSerialCallback = function (fns) {
		if (!fns.length) {
				return null;
		}
		return function (callback) {
				let that = this;
				let bound_fns = [];
				for (let i = 0, len = fns.length; i < len; i++) {
						(function (j) {
								bound_fns.push(function () {
										return fns[j].apply(that, arguments);
								});
						})(i);
				}
				return async.series(bound_fns, callback);
		};
};


/**
 * Wraps a group of tests with setUp and tearDown functions.
 * Used by testCase.
 *
 * @param {Object} group
 * @param {Array} setUps - parent setUp functions
 * @param {Array} tearDowns - parent tearDown functions
 * @api private
 */

let wrapGroup = function (group, setUps, tearDowns) {
		let tests = {};

		setUps = setUps ? setUps.slice(): [];
		tearDowns = tearDowns ? tearDowns.slice(): [];

		const { setUp, tearDown, ...group_ } = group;

		if (group.setUp) {
				setUps.push(group.setUp);
		}
		if (group.tearDown) {
				tearDowns.unshift(group.tearDown);
		}

		let keys = _keys(group_);

		for (let i = 0; i < keys.length; i += 1) {
				let k = keys[i];
				if (typeof group[k] === 'function') {
						tests[k] = wrapTest(
								getSerialCallback(setUps),
								getSerialCallback(tearDowns),
								group[k]
						);
				}
				else if (typeof group[k] === 'object') {
						tests[k] = wrapGroup(group[k], setUps, tearDowns);
				}
		}
		return tests;
};


/**
 * Backwards compatibility for test suites using old testCase API
 */

export const testCase = function (suite) {
		return suite;
};
