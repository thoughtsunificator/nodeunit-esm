/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

import nodeunit from '../nodeunit.js';
import * as utils from '../utils.js';
import fs from 'fs';
import path from 'path';
import { AssertionError } from '../assert.js';

/**
 * Reporter info string
 */

export const info = "Skip passed tests output";

/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

export const run = function (files, options, callback) {

		if (!options) {
				// load default options
				let content = fs.readFileSync(
						__dirname + '/../../bin/nodeunit.json', 'utf8'
				);
				options = JSON.parse(content);
		}

		let error = function (str) {
				return options.error_prefix + str + options.error_suffix;
		};
		let ok    = function (str) {
				return options.ok_prefix + str + options.ok_suffix;
		};
		let bold  = function (str) {
				return options.bold_prefix + str + options.bold_suffix;
		};
		let assertion_message = function (str) {
				return options.assertion_prefix + str + options.assertion_suffix;
		};
		let pass_indicator = process.platform === 'win32' ? '\u221A' : '✔';
		let fail_indicator = process.platform === 'win32' ? '\u00D7' : '✖';

		let start = new Date().getTime();
		let paths = files.map(function (p) {
				return path.resolve(p);
		});

		nodeunit.runFiles(paths, {
				testspec: options.testspec,
				testFullSpec: options.testFullSpec,
				moduleStart: function (name) {
						console.log('\n' + bold(name));
				},
				testDone: function (name, assertions) {
						if (assertions.failures()) {
								console.log(error(fail_indicator + ' ' + name) + '\n');
								assertions.forEach(function (a) {
										if (a.failed()) {
												a = utils.betterErrors(a);
												if (a.error instanceof AssertionError && a.message) {
														console.log(
																'Assertion Message: ' + assertion_message(a.message)
														);
												}
												console.log(a.error.stack + '\n');
										}
								});
						}
				},
				moduleDone: function (name, assertions) {
						if (!assertions.failures()) {
								console.log(pass_indicator + ' all tests passed');
						}
						else {
								console.log(error(fail_indicator + ' some tests failed'));
						}
				},
				done: function (assertions) {
						let end = new Date().getTime();
						let duration = end - start;
						if (assertions.failures()) {
								console.log(
										'\n' + bold(error('FAILURES: ')) + assertions.failures() +
										'/' + assertions.length + ' assertions failed (' +
										assertions.duration + 'ms)'
								);
						}
						else {
								console.log(
										'\n' + bold(ok('OK: ')) + assertions.length +
										' assertions (' + assertions.duration + 'ms)'
								);
						}

						if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
				}
		});
};
