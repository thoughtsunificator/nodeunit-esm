import { exec } from 'child_process';
import path from 'path';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bin = (process.platform === 'win32' ? 'node ' : "") +
		path.resolve(__dirname, '../bin/nodeunit.js');
const testfile_fullpath = path.resolve(__dirname, './fixtures/example_test.js');
const fixtures_path = path.resolve(__dirname, './fixtures');

export const runtestsuiteusingabsolutepath = function (test) {
		exec(bin + ' ' + testfile_fullpath, function (err, stdout, stderr) {
				if (err) {
						return test.done(err);
				}
				test.ok(/example/.test(stdout));
				test.ok(/1 assertion/.test(stdout));
				test.done();
		});
};

export const runsonlytoplevelsuiteswithoutrecursiveflag = function (test) {
		exec(bin + ' ' + fixtures_path, function (err, stdout, stderr) {
				if (err) {
						return test.done(err);
				}
				test.ok(/example/.test(stdout));
				test.ok(!/example sub/.test(stdout));
				test.done();
		});
};

export const runstopnestedsuiteswithrecursiveflag = function (test) {
		exec(bin + ' ' + fixtures_path + ' -r', function (err, stdout, stderr) {
				if (err) {
						return test.done(err);
				}
				test.ok(/example/.test(stdout));
				test.ok(/exampleSub/.test(stdout));
				test.done();
		});
};
