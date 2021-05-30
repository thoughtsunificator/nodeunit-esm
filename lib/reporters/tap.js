/**
 * Module dependencies
 */

import nodeunit from '../nodeunit.js';
import path from 'path';
import * as tap from 'tap';
import fs from 'fs';

/**
 * Reporter info string
 */

export const info = "TAP output";

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

		let paths = files.map(function (p) {
				return path.resolve(p);
		});

		tap.pipe(process.stdout);

		nodeunit.runFiles(paths, {
				testStart: function (name) {
						tap.comment(name.toString());
				},
				testDone: function (name, assertions) {
						assertions.forEach(function (e) {
								let extra = {};
								if (e.error) {
										extra.error = {
												name: e.error.name,
												message: e.error.message,
												stack: e.error.stack.split(/\n/).filter(function (line) {
														// exclude line of "types.js"
														return ! RegExp(/types.js:83:39/).test(line);
												}).join('\n')
										};
										extra.wanted = e.error.expected;
										extra.found = e.error.actual;
								}
								tap.assert(e.passed(), e.message, extra);
						});
				},
				done: function (assertions) {
						tap.end();
						if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
				}
		});
};
