/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

import nodeunit from '../nodeunit.js'
import * as utils from '../utils.js';
import fs from 'fs';
import * as track from '../track.js';
import path from 'path';
import { AssertionError } from '../assert.js';

/**
 * Reporter info string
 */

export const info = "Verbose tests reporter"


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
		let tracker = track.createTracker(function (tracker) {
				if (tracker.unfinished()) {
						console.log('');
						console.log(error(bold(
								'FAILURES: Undone tests (or their setups/teardowns): '
						)));
						let names = tracker.names();
						for (let i = 0; i < names.length; i += 1) {
								console.log('- ' + names[i]);
						}
						console.log('');
						console.log('To fix this, make sure all tests call test.done()');
						process.reallyExit(tracker.unfinished());
				}
		});

		nodeunit.runFiles(paths, {
				testspec: options.testspec,
				testFullSpec: options.testFullSpec,
				moduleStart: function (name) {
						console.log('\n' + bold(name));
				},
				testDone: function (name, assertions) {
						tracker.remove(name);

						if (!assertions.failures()) {
								console.log(pass_indicator + ' ' + name);
						}
						else {
								console.log(error(fail_indicator + ' ' + name));
						}
						// verbose so print everything
						assertions.forEach(function (a) {
							if (a.failed()) {
								console.log(error('  ' + fail_indicator + ' ' + a.message));
								a = utils.betterErrors(a);
								console.log('  ' + a.error.stack);
							}
							else {
								console.log('  ' + pass_indicator + ' ' + a.message);
							}
						});
				},
				done: function (assertions, end) {
						let end = end || new Date().getTime();
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
				},
				testStart: function(name) {
						tracker.put(name);
				}
		});
};
