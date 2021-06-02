/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */
import async from '../deps/async.js';
import * as types from './types.js';
import * as utils from './utils.js';
import * as core from './core.js';
import * as assert from './assert.js';
import path from 'path';
import events from 'events';
import { pathToFileURL } from 'url';

const nodeunit = {
	types,
	utils,
	assert
};

/**
 * Export all core functions
 */

for (let k in core) {
		nodeunit[k] = core[k];
};


/**
 * Load modules from paths array and run all exported tests in series. If a path
 * is a directory, load all supported file types inside it as modules. This only
 * reads 1 level deep in the directory and does not recurse through
 * sub-directories.
 *
 * @param {Array} paths
 * @param {Object} opt
 * @api public
 */

nodeunit.runFiles = function (paths, opt) {
		let all_assertions = [];
		let options = types.options(opt);
		let start = new Date().getTime();

		if (!paths.length) {
				return options.done(types.assertionList(all_assertions));
		}

		utils.modulePaths(paths, function (err, files) {
				if (err) throw err;
				async.concatSeries(files, async function (file, cb) {
						let name = path.basename(file);
						let fileModule
						try {
							fileModule = await import(pathToFileURL(file))
							nodeunit.runModule(name, fileModule, options, cb);
						} catch(ex) {
							console.error(ex)
						}
				},
				function (err, all_assertions) {
						let end = new Date().getTime();
						done()
						options.done(types.assertionList(all_assertions, end - start));
				});
		}, options.recursive);

};


/* Export all prototypes from events.EventEmitter */
let label;
for (label in events.EventEmitter.prototype) {
	nodeunit[label] = events.EventEmitter.prototype[label];
}

/* Emit event 'complete' on completion of a test suite. */
export const complete = function(name, assertions)
{
		nodeunit.emit('complete', name, assertions);
};

/* Emit event 'complete' on completion of all tests. */
export const done = function()
{
		nodeunit.emit('done');
};

export default nodeunit;
