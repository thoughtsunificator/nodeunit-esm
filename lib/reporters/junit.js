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
import async from '../../deps/async.js';
import { AssertionError } from '../assert.js';
import child_process from 'child_process';
import ejs from 'ejs';

/**
 * Reporter info string
 */

export const info = "jUnit XML test reports";


/**
 * Ensures a directory exists using mkdir -p.
 *
 * @param {String} path
 * @param {Function} callback
 * @api private
 */

let ensureDir = function (path, callback) {
		let mkdir = child_process.spawn('mkdir', ['-p', path]);
		mkdir.on('error', function (err) {
				callback(err);
				callback = function(){};
		});
		mkdir.on('exit', function (code) {
				if (code === 0) callback();
				else callback(new Error('mkdir exited with code: ' + code));
		});
};


/**
 * Returns absolute version of a path. Relative paths are interpreted
 * relative to process.cwd() or the cwd parameter. Paths that are already
 * absolute are returned unaltered.
 *
 * @param {String} p
 * @param {String} cwd
 * @return {String}
 * @api public
 */

let abspath = function (p, /*optional*/cwd) {
		if (p[0] === '/') return p;
		cwd = cwd || process.cwd();
		return path.normalize(path.resolve(p));
};


/**
 * Run all tests within each module, reporting the results to the command-line,
 * then writes out junit-compatible xml documents.
 *
 * @param {Array} files
 * @api public
 */

export const run = function (files, opts, callback) {
		if (!opts.output) {
				console.error(
						'Error: No output directory defined.\n' +
						'\tEither add an "output" property to your nodeunit.json config ' +
						'file, or\n\tuse the --output command line option.'
				);
				return;
		}
		opts.output = abspath(opts.output);
		let error = function (str) {
				return opts.error_prefix + str + opts.error_suffix;
		};
		let ok    = function (str) {
				return opts.ok_prefix + str + opts.ok_suffix;
		};
		let bold  = function (str) {
				return opts.bold_prefix + str + opts.bold_suffix;
		};

		let start = new Date().getTime();
		let paths = files.map(function (p) {
				return path.resolve(p);
		});

		let modules = {};
		let curModule;

		nodeunit.runFiles(paths, {
				testspec: opts.testspec,
				testFullSpec: opts.testFullSpec,
				moduleStart: function (name) {
						curModule = {
								errorCount: 0,
								failureCount: 0,
								tests: 0,
								testcases: {},
								name: name,
								start: new Date().getTime()
						};
						modules[name] = curModule;
				},
				testStart: function(name) {
						curModule.testcases[name] = {name: name, start : new Date().getTime()};
				},
				moduleDone: function(name) {
						curModule.end =  new Date().getTime();
				},
				testDone: function (name, assertions) {
						let testcase = curModule.testcases[name];
						testcase.end = new Date().getTime();
						for (let i=0; i<assertions.length; i++) {
								let a = assertions[i];
								if (a.failed()) {
										a = utils.betterErrors(a);
										testcase.failure = {
												message: a.message,
												backtrace: a.error.stack
										};

										if (a.error instanceof AssertionError) {
												curModule.failureCount++;
										}
										else {
												curModule.errorCount++;
										}
										break;
								}
						}
						curModule.tests++;
						curModule.testcases[name] = testcase;;
				},
				done: function (assertions) {
						let end = new Date().getTime();
						let duration = end - start;

						ensureDir(opts.output, function (err) {
								let tmpl = __dirname + "/../../share/junit.xml.ejs";
								fs.readFile(tmpl, function (err, data) {
										if (err) throw err;
										let tmpl = data.toString();
										for(let k in modules) {
												let module = modules[k];
												let rendered = ejs.render(tmpl, {
														suites: [module]
												});
												let filename = path.resolve(
														opts.output,
														module.name + '.xml'
												);
												console.log('Writing ' + filename);
												fs.writeFileSync(filename, rendered, 'utf8');
										}
										if (assertions.failures()) {
												console.log(
														'\n' + bold(error('FAILURES: ')) +
														assertions.failures() + '/' +
														assertions.length + ' assertions failed (' +
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
								});
						});
				}
		});
}
