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
import * as track from '../track.js';
import { AssertionError } from '../assert.js';

/**
 * Reporter info string
 */

export const info = "Pretty minimal output";

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

		let red   = function (str) {
				return options.error_prefix + str + options.error_suffix;
		};
		let green = function (str) {
				return options.ok_prefix + str + options.ok_suffix;
		};
		let magenta = function (str) {
				return options.assertion_prefix + str + options.assertion_suffix;
		};
		let bold  = function (str) {
				return options.bold_prefix + str + options.bold_suffix;
		};

		let start = new Date().getTime();

		let tracker = track.createTracker(function (tracker) {
				if (tracker.unfinished()) {
						console.log('');
						console.log(bold(red(
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


	let opts = {
			testspec: options.testspec,
			testFullSpec: options.testFullSpec,
				moduleStart: function (name) {
						process.stdout.write(bold(name) + ': ');
				},
				moduleDone: function (name, assertions) {
						console.log('');
						if (assertions.failures()) {
								assertions.forEach(function (a) {
										if (a.failed()) {
												a = utils.betterErrors(a);
												if (a.error instanceof AssertionError && a.message) {
														console.log(
																'Assertion in test ' + bold(a.testname) + ': ' +
																magenta(a.message)
														);
												}
												console.log(a.error.stack + '\n');
										}
								});
						}

				},
				testStart: function (name) {
						tracker.put(name);
				},
				testDone: function (name, assertions) {
						tracker.remove(name);

						if (!assertions.failures()) {
								process.stdout.write('.');
						}
						else {
								process.stdout.write(red('F'));
								assertions.forEach(function (assertion) {
										assertion.testname = name;
								});
						}
				},
				done: function (assertions) {
						let end = new Date().getTime();
						let duration = end - start;
						if (assertions.failures()) {
								console.log(
										'\n' + bold(red('FAILURES: ')) + assertions.failures() +
										'/' + assertions.length + ' assertions failed (' +
										assertions.duration + 'ms)'
								);
						}
						else {
								console.log(
										'\n' + bold(green('OK: ')) + assertions.length +
										' assertions (' + assertions.duration + 'ms)'
								);
						}

						if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
				}
		};

	if (files && files.length) {
			let paths = files.map(function (p) {
					return path.resolve(p);
			});
			nodeunit.runFiles(paths, opts);
	} else {
		nodeunit.runModules(files,opts);
	}
};