# nodeunit-esm

Remake of https://github.com/caolan/nodeunit using ECMAScript modules.

All credit goes to the [original contributors](https://github.com/caolan/nodeunit/blob/master/CONTRIBUTORS.md).

Simple syntax, powerful tools. Nodeunit provides easy async unit testing for
node.js and the browser.

Features
--------

* Simple to use
* Just export the tests from a module
* Works with node.js and in the browser
* Helps you avoid common pitfalls when testing asynchronous code
* Easy to add test cases with setUp and tearDown functions if you wish
* Flexible reporters for custom output, built-in support for HTML and jUnit XML
* Allows the use of mocks and stubs

Usage
-----

Here is an example unit test module:

		export function testSomething(test) {
				test.expect(1);
				test.ok(true, "this assertion should pass");
				test.done();
		};

		export function testSomethingElse(test) {
				test.ok(false, "this assertion should fail");
				test.done();
		};

When run using the included test runner, this will output the following:

<img src="https://github.com/thoughtsunificator/nodeunit-esm/raw/master/img/example_fail.png" />

Installation
------------

There are two options for installing nodeunit:

1. Clone / download nodeunit from [github](https://github.com/thoughtsunificator/nodeunit-esm),
	 then:

		make && sudo make install

2. Install via npm:

		npm install nodeunit-esm -g

API Documentation
-----------------

Nodeunit uses the functions available in the node.js
[assert module](http://nodejs.org/docs/v0.4.2/api/assert.html):

* __ok(value, [message])__ - Tests if value is a true value.
* __equal(actual, expected, [message])__ - Tests shallow, coercive equality
	with the equal comparison operator ( == ).
* __notEqual(actual, expected, [message])__ - Tests shallow, coercive
	non-equality with the not equal comparison operator ( != ).
* __deepEqual(actual, expected, [message])__ - Tests for deep equality.
* __notDeepEqual(actual, expected, [message])__ - Tests for any deep
	inequality.
* __strictEqual(actual, expected, [message])__ - Tests strict equality, as
	determined by the strict equality operator ( === )
* __notStrictEqual(actual, expected, [message])__ - Tests strict non-equality,
	as determined by the strict not equal operator ( !== )
* __throws(block, [error], [message])__ - Expects block to throw an error.
* __doesNotThrow(block, [error], [message])__ - Expects block not to throw an
	error.
* __ifError(value)__ - Tests if value is not a false value, throws if it is a
	true value. Useful when testing the first argument, error in callbacks.

Nodeunit also provides the following functions within tests:

* __expect(amount)__ - Specify how many assertions are expected to run within a
	test. Very useful for ensuring that all your callbacks and assertions are
	run.
* __done()__ - Finish the current test function, and move on to the next. ALL
	tests should call this!

Nodeunit aims to be simple and easy to learn. This is achieved through using
existing structures (such as node.js modules) to maximum effect, and reducing
the API where possible, to make it easier to digest.

Tests are simply exported from a module, but they are still run in the order
they are defined.

__Note:__ Users of old nodeunit versions may remember using `ok`, `equals` and
`same` in the style of qunit, instead of the assert functions above. These
functions still exist for backwards compatibility, and are simply aliases to
their assert module counterparts.


Asynchronous Testing
--------------------

When testing asynchronous code, there are a number of sharp edges to watch out
for. Thankfully, nodeunit is designed to help you avoid as many of these
pitfalls as possible. For the most part, testing asynchronous code in nodeunit
_just works_.


### Tests run in series

While running tests in parallel seems like a good idea for speeding up your
test suite, in practice I've found it means writing much more complicated
tests. Because of node's module cache, running tests in parallel means mocking
and stubbing is pretty much impossible. One of the nicest things about testing
in javascript is the ease of doing stubs:

		var _readFile = fs.readFile;
		fs.readFile = function(path, callback) {
				// it's a stub!
		};
		// test function that uses fs.readFile

		// we're done
		fs.readFile = _readFile;

You cannot do this when running tests in parallel. In order to keep testing as
simple as possible, nodeunit avoids it. Thankfully, most unit-test suites run
fast anyway.


### Explicit ending of tests

When testing async code it's important that tests end at the correct point, not
just after a given number of assertions. Otherwise your tests can run short,
ending before all assertions have completed. It's important to detect too
many assertions as well as too few. Combining explicit ending of tests with
an expected number of assertions helps to avoid false test passes, so be sure
to use the `test.expect()` method at the start of your test functions, and
`test.done()` when finished.


Groups, setUp and tearDown
--------------------------

Nodeunit allows the nesting of test functions:

		export function test1(test) {
				...
		}

		export const group = {
				test2: function (test) {
						...
				},
				test3: function (test) {
						...
				}
		}

This would be run as:

		test1
		group - test2
		group - test3

Using these groups, Nodeunit allows you to define a `setUp` function, which is
run before each test, and a `tearDown` function, which is run after each test
calls `test.done()`:

		export default = {
				setUp: function (callback) {
						this.foo = 'bar';
						callback();
				},
				tearDown: function (callback) {
						// clean up
						callback();
				},
				test1: function (test) {
						test.equals(this.foo, 'bar');
						test.done();
				}
		};

In this way, it's possible to have multiple groups of tests in a module, each
group with its own setUp and tearDown functions.


Running Tests
-------------

Nodeunit comes with a basic command-line test runner, which can be installed
using `sudo make install`. Example usage:

		nodeunit-esm testmodule1.js testfolder [...]

If no entry file specified, `test` defaults.

The default test reporter uses color output, because I think that's more fun :) I
intend to add a no-color option in future. To give you a feeling of the fun you'll
be having writing tests, lets fix the example at the start of the README:

<img src="https://github.com/thoughtsunificator/nodeunit-esm/raw/master/img/example_pass.png" />

Ahhh, Doesn't that feel better?

When using the included test runner, it will exit using the failed number of
assertions as the exit code.  This means it exits with 0 when all tests pass.


### Command-line Options

* __--reporter FILE__ - you can set the test reporter to a custom module or
on of the modules in nodeunit/lib/reporters, when omitted, the default test runner
is used.
* __--list-reporters__ - list available built-in reporters.
* __--config FILE__ - load config options from a JSON file, allows
the customisation of color schemes for the default test reporter etc. See
bin/nodeunit.json for current available options.
* __-t testName__ - run specific test only.
* __-f fullTestName__ - run specific test only. fullTestName is built so: "outerGroup - .. - innerGroup - testName".
* __--version__ or __-v__ - report nodeunit version
* __--help__ - show nodeunit help


Running tests in the browser
----------------------------

Nodeunit tests can also be run inside the browser. For example usage, see
the examples/browser folder. The basic syntax is as follows:

__test.html__

		<html>
			<head>
				<title>Example Test Suite</title>
				<link rel="stylesheet" href="nodeunit.css" type="text/css" />
				<script src="nodeunit.js"></script>
				<script src="suite1.js"></script>
				<script src="suite2.js"></script>
			</head>
			<body>
				<h1 id="nodeunit-header">Example Test Suite</h1>
				<script>
					nodeunit.run({
						'Suite One': suite1,
						'Suite Two': suite2
					});
				</script>
			</body>
		</html>

Here, `suite1` and `suite2` are just object literals containing test functions
or groups, as would be returned if you did `import testSuite from 'test-suite'` in node.js:

__suite1.js__

		this.suite1 = {
				'example test': function (test) {
						test.ok(true, 'everything is ok');
						test.done();
				}
		};

If you wish to use a commonjs format for your test suites (using exports), it is
up to you to define the commonjs tools for the browser. There are a number of
alternatives and it's important it fits with your existing code, which is
why nodeunit does not currently provide this out of the box.

In the example above, the tests will run when the page is loaded.

The browser-version of nodeunit.js is created in dist/browser when you do, `make
browser`. You'll need [UglifyJS](https://github.com/mishoo/UglifyJS) installed in
order for it to automatically create nodeunit.min.js.


Adding nodeunit to Your Projects
--------------------------------

If you don't want people to have to install the nodeunit command-line tool,
you'll want to create a script that runs the tests for your project with the
correct require paths set up. Here's an example test script, that assumes you
have nodeunit in a suitably located node_modules directory.

		#!/usr/bin/env node
		import { reporters } from 'nodeunit-esm'
		reporters.default.run(['test']);

If you're using git, you might find it useful to include nodeunit as a
submodule. Using submodules makes it easy for developers to download nodeunit
and run your test suite, without cluttering up your repository with
the source code. To add nodeunit as a git submodule do the following:

		git submodule add git://github.com/thoughtsunificator/nodeunit-esm.git lib/nodeunit

This will add nodeunit to the node_modules folder of your project. Now, when
cloning the repository, nodeunit can be downloaded by doing the following:

		git submodule init
		git submodule update

Let's update the test script above with a helpful hint on how to get nodeunit,
if it's missing:

		#!/usr/bin/env node
		try {
				import { reporters } from 'nodeunit-esm'
		}
		catch(e) {
				console.log("Cannot find nodeunit module.");
				console.log("You can download submodules for this project by doing:");
				console.log("");
				console.log("    git submodule init");
				console.log("    git submodule update");
				console.log("");
				process.exit();
		}

		process.chdir(__dirname);
		reporters.default.run(['test']);

Now if someone attempts to run your test suite without nodeunit installed they
will be prompted to download the submodules for your project.


Built-in Test Reporters
-----------------------

* __default__ - The standard reporter seen in the nodeunit screenshots
* __minimal__ - Pretty, minimal output, shows errors and progress only
* __html__ - Outputs a HTML report to stdout
* __junit__ - Creates jUnit compatible XML reports, which can be used with
	continuous integration tools such as [Hudson](http://hudson-ci.org/).
* __machineout__ - Simple reporter for machine analysis. There is
	[nodeunit.vim](https://github.com/lambdalisue/nodeunit.vim) which is useful for TDD on VIM.


Writing a Test Reporter
---------------------

Nodeunit exports runTest(fn, options), runModule(mod, options) and
runFiles(paths, options). You'll most likely want to run test suites from
files, which can be done using the latter function. The _options_ argument can
contain callbacks which run during testing. Nodeunit provides the following
callbacks:

* __moduleStart(name)__ - called before a module is tested
* __moduleDone(name, assertions)__ - called once all test functions within the
	module have completed (see assertions object reference below)
	ALL tests within the module
* __testStart(name)__ - called before a test function is run
* __testReady(test)__ - called before a test function is run with the test object that will be passed to the test function
* __testDone(name, assertions)__ - called once a test function has completed
	(by calling test.done())
* __log(assertion)__ - called whenever an assertion is made (see assertion
	object reference below)
* __done(assertions)__ - called after all tests/modules are complete

The __assertion__ object:

* __passed()__ - did the assertion pass?
* __failed()__ - did the assertion fail?
* __error__ - the AssertionError if the assertion failed
* __method__ - the nodeunit assertion method used (ok, same, equals...)
* __message__ - the message the assertion method was called with (optional)

The __assertionList__ object:

* An array-like object with the following new attributes:
	* __failures()__ - the number of assertions which failed
	* __duration__ - the time taken for the test to complete in msecs

For a reference implementation of a test reporter, see lib/reporters/default.js in
the nodeunit project directory.


Sandbox utility
---------------

This is a function which evaluates JavaScript files in a sandbox and returns the
context. The sandbox function can be used for testing client-side code or private
un-exported functions within a module.

		import { utils } from "nodeunit-esm"
		var example = utils.sandbox('example.js');

__sandbox(files, sandbox)__ - Evaluates JavaScript files in a sandbox, returning
the context. The first argument can either be a single filename or an array of
filenames. If multiple filenames are given their contents are concatenated before
evaluation. The second argument is an optional context to use for the sandbox.

Note: When working with the sandbox if your script depends on outside sources
(i.e. using `require`) then you will want to pass that into the optional
context when setting up the sandbox.

		import { utils } from "nodeunit-esm"
		// pass in some node globals
		var box_globals = {
				// Passing module.exports into the sandbox will give your code  access to it.
				module: {exports: exports},
				// Passing require into the sandbox will give your code  access to use it AND
				// will share the cache with modules already required from outside the sandbox.
				require: require,
				// Passing console into the sandbox will give your code access to it
				console: console
		};
		var example = utils.sandbox('example.js', box_globals);


Running the nodeunit Tests
--------------------------

The tests for nodeunit are written using nodeunit itself as the test framework.
However, the module test-base.js first does some basic tests using the assert
module to ensure that test functions are actually run, and a basic level of
nodeunit functionality is available.

To run the nodeunit tests do:

		make test

__Note:__ There was a bug in node v0.2.0 causing the tests to hang, upgrading
to v0.2.1 fixes this.


__machineout__ reporter
----------------------------------------------

The default reporter is readable for human but not for machine analysis.
When you want to analyze the output of nodeunit, use __machineout__ reporter and you will get

<img src="https://github.com/thoughtsunificator/nodeunit-esm/raw/master/img/example_machineout.png" />


nodeunit with vim
----------------------------------
There is [nodeunit.vim](https://github.com/lambdalisue/nodeunit.vim) so you can use
nodeunit with VIM.

That compiler uses __machineout__ reporter and it is useful to use
with [vim-makegreen](https://github.com/reinh/vim-makegreen).
