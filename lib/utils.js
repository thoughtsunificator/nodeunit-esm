/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

import async from '../deps/async.js';
import fs from 'fs';
import util from 'util';
import { Script } from 'vm';
import http from 'http';
import path from 'path';


/**
 * Detect if coffee-script, iced-coffeescript, or streamline are available and
 * the respective file extensions to the search filter in modulePaths if it is.
 */

let extensions = [ 'js' ];  // js is always supported: add it unconditionally
let extensionPattern;

// try {
// 		require('coffee' + '-script/register');
// 		extensions.push('coffee');
// } catch (e) { }

// try {
// 		require('iced-coffee' + '-script/register');
// 		extensions.push('iced');
// } catch (e) { }

// try {
// 		require('stream' + 'line').register();
// 		extensions.push('_coffee');
// 		extensions.push('_js');
// } catch (e) { }

extensionPattern = new RegExp('\\.(?:' + extensions.join('|') + ')$');


/**
 * Finds all modules at each path in an array, If a path is a directory, it
 * returns all supported file types inside it. This only reads 1 level deep in
 * the directory and does not recurse through sub-directories.
 *
 * The extension (.js, .coffee etc) is stripped from the filenames so they can
 * simply be require()'ed.
 *
 * @param {Array} paths
 * @param {Function} callback
 * @param {Boolean=} recursive
 * @api public
 */
export const modulePaths = function modulePaths(paths, callback, recursive) {
		recursive = (recursive === true);
		async.concatSeries(paths, function (p, cb) {
				fs.stat(p, function (err, stats) {
						if (err) {
								return cb(err);
						}
						if (stats.isFile()) {
								return cb(null, [p]);
						}
						if (stats.isDirectory()) {
								fs.readdir(p, function (err, files) {
										if (err) {
												return cb(err);
										}

										// filter out any filenames with unsupported extensions
										let modules = files.filter(function (filename) {
												return extensionPattern.exec(filename);
										});

										// remove extension from module name and prepend the
										// directory path
										let fullpaths = modules.map(function (filename) {
												// let mod_name = filename.replace(extensionPattern, '');
												return [p, filename].join('/');
										});

										if (recursive) {
												// get all sub directories
												let directories =
														files
																.map(function(filename) {
																		// resolve path first
																		return path.resolve(p, filename);
																})
																.filter(function(filename) {
																		// fetch only directories
																		return (fs.statSync(filename).isDirectory());
																});

												// recursively call modulePaths() with sub directories
												modulePaths(directories, function(err, files) {
														if (!err) {
																cb(null, fullpaths.concat(files).sort())
														} else {
																cb(err);
														}
												}, recursive);
										} else {
												// sort filenames here, because Array.map changes order
												fullpaths.sort();

												// finish
												cb(null, fullpaths);
										}

								});
						}
				});
		}, callback);
};

/**
 * Evaluates JavaScript files in a sandbox, returning the context. The first
 * argument can either be a single filename or an array of filenames. If
 * multiple filenames are given their contents are concatenated before
 * evalution. The second argument is an optional context to use for the sandbox.
 *
 * @param files
 * @param {Object} sandbox
 * @return {Object}
 * @api public
 */

export const sandbox = function (files, /*optional*/sandbox) {
		let source, script, result;
		if (!(files instanceof Array)) {
				files = [files];
		}
		source = files.map(function (file) {
				return fs.readFileSync(file, 'utf8');
		}).join('');

		if (!sandbox) {
				sandbox = {};
		}
		script = new Script(source);
		result = script.runInNewContext(sandbox);
		return sandbox;
};

/**
 * Provides a http request, response testing environment.
 *
 * Example:
 *
 *  let httputil = require('nodeunit').utils.httputil
 *  export const testSomething = function(test) {
 *    httputil(function (req, resp) {
 *        resp.writeHead(200, {});
 *        resp.end('test data');
 *      },
 *      function(server, client) {
 *        client.fetch('GET', '/', {}, function(resp) {
 *          test.equal('test data', resp.body);
 *          server.close();
 *          test.done();
 *        })
 *      });
 *  };
 *
 * @param {Function} cgi
 * @param {Function} envReady
 * @api public
 */
export const httputil = function (cgi, envReady) {
		let hostname = process.env.HOSTNAME || 'localhost';
		let port = process.env.PORT || 3000;

		let server = http.createServer(cgi);
		server.listen(port, hostname);

		let agent = new http.Agent({ host: hostname, port: port, maxSockets: 1 });
		let client = {
				fetch: function (method, path, headers, respReady) {
						let request = http.request({
								host: hostname,
								port: port,
								agent: agent,
								method: method,
								path: path,
								headers: headers
						});
						request.end();
						request.on('response', function (response) {
								response.setEncoding('utf8');
								response.on('data', function (chunk) {
										if (response.body) {
												response.body += chunk;
										} else {
												response.body = chunk;
										}
								});
								response.on('end', function () {
										if (response.headers['content-type'] === 'application/json') {
												response.bodyAsObject = JSON.parse(response.body);
										}
										respReady(response);
								});
						});
				}
		};

		process.nextTick(function () {
				if (envReady && typeof envReady === 'function') {
						envReady(server, client);
				}
		});
};


/**
 * Improves formatting of AssertionError messages to make deepEqual etc more
 * readable.
 *
 * @param {Object} assertion
 * @return {Object}
 * @api public
 */

export const betterErrors = function (assertion) {
		if (!assertion.error) {
				return assertion;
		}
		let e = assertion.error;

		if (typeof e.actual !== 'undefined' && typeof e.expected !== 'undefined') {
				let actual = util.inspect(e.actual, false, 10).replace(/\n$/, '');
				let expected = util.inspect(e.expected, false, 10).replace(/\n$/, '');

				let multiline = (
						actual.indexOf('\n') !== -1 ||
						expected.indexOf('\n') !== -1
				);
				let spacing = (multiline ? '\n' : ' ');
				e._message = e.message;
				e.stack = (
						e.name + ':' + spacing +
						actual + spacing + e.operator + spacing +
						expected + '\n' +
						e.stack.split('\n').slice(1).join('\n')
				);
		}
		return assertion;
};
