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
import * as track from '../track.js';
import fs from 'fs';
import path from 'path';
import { AssertionError } from '../assert.js';

/**
 * Reporter info string
 */

export const info = "Reporter for eclipse plugin";


/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

export const run = function (files, options, callback) {

		let start = new Date().getTime();
		let paths = files.map(function (p) {
				if (p.indexOf('/') === 0) {
						return p;
				}
				return path.resolve(p);
		});
		let tracker = track.createTracker(function (tracker) {
				if (tracker.unfinished()) {
						console.log('');
						console.log('FAILURES: Undone tests (or their setups/teardowns): ');
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
				testspec: undefined,
				moduleStart: function (name) {
						console.log('\n' + name);
				},
				testDone: function (name, assertions) {
						tracker.remove(name);

						if (!assertions.failures()) {
								console.log('✔ ' + name);
						}
						else {
								console.log('✖ ' + name + '\n');
								assertions.forEach(function (a) {
										if (a.failed()) {
												a = utils.betterErrors(a);
												if (a.error instanceof AssertionError && a.message) {
														console.log(
																'Assertion Message: ' + a.message
														);
												}
												console.log(a.error.stack + '\n');
										}
								});
						}
				},
				done: function (assertions, end) {
						let end = end || new Date().getTime();
						let duration = end - start;
						if (assertions.failures()) {
								console.log(
										'\n' + 'FAILURES: ' + assertions.failures() +
										'/' + assertions.length + ' assertions failed (' +
										assertions.duration + 'ms)'
								);
						}
						else {
								console.log(
									 '\n' + 'OK: ' + assertions.length +
									 ' assertions (' + assertions.duration + 'ms)'
								);
						}

						if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
				},
				testStart: function (name) {
						tracker.put(name);
				}
		});
};
