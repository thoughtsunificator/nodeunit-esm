import path from 'path';
import nodeunit from '../lib/nodeunit.js';
import { sandbox } from '../lib/utils.js';
const testCase = nodeunit.testCase;

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const testSimpleSandbox = function (test) {
		let raw_jscode1 = sandbox(__dirname + '/fixtures/raw_jscode1.js');
		test.equal(raw_jscode1.hello_world('foo'), '_foo_', 'evaluation ok');
		test.done();
};

export const testSandboxContext = function (test) {
		let a_letiable = 42; // should not be visible in the sandbox
		let raw_jscode2 = sandbox(__dirname + '/fixtures/raw_jscode2.js');
		a_letiable = 42; // again for the win
		test.equal(
				raw_jscode2.get_a_letiable(),
				'undefined',
				'the letiable should not be defined'
		);
		test.done();
};

export const testSandboxMultiple = function (test) {
		let raw_jscode3 = sandbox([
				__dirname + '/fixtures/raw_jscode3.js',
				__dirname + '/fixtures/raw_jscode3.js',
				__dirname + '/fixtures/raw_jscode3.js'
		]);
		test.equal(raw_jscode3.t, 3, 'two files loaded');
		test.done();
};
