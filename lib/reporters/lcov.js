/**
 * Module dependencies
 */

import nodeunit from '../nodeunit.js';
import path from 'path';

/**
 * Reporter info string
 */

export const info = 'The LCOV reporter reads JS files instrumented by JSCoverage (http://siliconforks.com/jscoverage/) and outputs coverage data in the LCOV format (http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php)';

/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

export const run = function (files, options, callback) {

		let paths = files.map(function (p) {
				return path.resolve(p);
		});

		nodeunit.runFiles(paths, {
				done: function (assertions) {
						let cov = (global || window)._$jscoverage || {};

						Object.keys(cov).forEach(function (filename) {
								let data = cov[filename];
								reportFile(filename, data);
						});

						if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
				}
		});
};

function reportFile(filename, data) {
		console.log('SF:' + filename);

		data.source.forEach(function(line, num) {
				// increase the line number, as JS arrays are zero-based
				num++;

				if (data[num] !== undefined) {
						console.log('DA:' + num + ',' + data[num]);
				}
		});

		console.log('end_of_record');
}
