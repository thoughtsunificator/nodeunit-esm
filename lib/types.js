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

import * as assert from './assert.js'     //@REMOVE_LINE_FOR_BROWSER
import async from '../deps/async.js' //@REMOVE_LINE_FOR_BROWSER


/**
 * Creates assertion objects representing the result of an assert call.
 * Accepts an object or AssertionError as its argument.
 *
 * @param {object} obj
 * @api public
 */

export const assertion = function (obj) {
		return {
				method: obj.method || '',
				message: obj.message || (obj.error && obj.error.message) || '',
				error: obj.error,
				passed: function () {
						return !this.error;
				},
				failed: function () {
						return Boolean(this.error);
				}
		};
};

/**
 * Creates an assertion list object representing a group of assertions.
 * Accepts an array of assertion objects.
 *
 * @param {Array} arr
 * @param {Number} duration
 * @api public
 */

export const assertionList = function (arr, duration) {
		let that = arr || [];
		that.failures = function () {
				let failures = 0;
				for (let i = 0; i < this.length; i += 1) {
						if (this[i].failed()) {
								failures += 1;
						}
				}
				return failures;
		};
		that.passes = function () {
				return that.length - that.failures();
		};
		that.duration = duration || 0;
		return that;
};

/**
 * Create a wrapper function for assert module methods. Executes a callback
 * after it's complete with an assertion object representing the result.
 *
 * @param {Function} callback
 * @api private
 */

let assertWrapper = function (callback) {
		return function (new_method, assert_method, arity) {
				return function () {
						let message = arguments[arity - 1];
						let a = assertion({method: new_method, message: message});
						try {
								assert[assert_method].apply(null, arguments);
						}
						catch (e) {
								a.error = e;
						}
						callback(a);
				};
		};
};

/**
 * Creates the 'test' object that gets passed to every test function.
 * Accepts the name of the test function as its first argument, followed by
 * the start time in ms, the options object and a callback function.
 *
 * @param {String} name
 * @param {Number} start
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */

export const test = function (name, start, options, callback) {
		let expecting;
		let a_list = [];

		let wrapAssert = assertWrapper(function (a) {
				a_list.push(a);
				if (options.log) {
						async.nextTick(function () {
								options.log(a);
						});
				}
		});
		let test_ = {
				done: function (err) {
						if (expecting !== undefined && expecting !== a_list.length) {
								let e = new Error(
										'Expected ' + expecting + ' assertions, ' +
										a_list.length + ' ran'
								);
								let a1 = assertion({method: 'expect', error: e});
								a_list.push(a1);
								if (options.log) {
										async.nextTick(function () {
												options.log(a1);
										});
								}
						}
						if (err) {
								let a2 = assertion({error: err});
								a_list.push(a2);
								if (options.log) {
										async.nextTick(function () {
												options.log(a2);
										});
								}
						}
						let end = new Date().getTime();
						async.nextTick(function () {
								let assertion_list = assertionList(a_list, end - start);
								options.testDone(name, assertion_list);
								callback(null, a_list);
						});
				},
				ok: wrapAssert('ok', 'ok', 2),
				same: wrapAssert('same', 'deepEqual', 3),
				equals: wrapAssert('equals', 'equal', 3),
				expect: function (num) {
						expecting = num;
				},
				_assertion_list: a_list,
		};
		// add all functions from the assert module
		for (const k in assert) {
			test_[k] = wrapAssert(k, k, assert[k].length);
		}
		return test_;
};

/**
 * Ensures an options object has all callbacks, adding empty callback functions
 * if any are missing.
 *
 * @param {Object} opt
 * @return {Object}
 * @api public
 */

export const options = function (opt) {
		let optionalCallback = function (name) {
				opt[name] = opt[name] || function () {};
		};

		optionalCallback('moduleStart');
		optionalCallback('moduleDone');
		optionalCallback('testStart');
		optionalCallback('testReady');
		optionalCallback('testDone');
		//optionalCallback('log');

		// 'done' callback is not optional.

		return opt;
};
