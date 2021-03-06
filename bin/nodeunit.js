#!/usr/bin/env node

import fs from 'fs';
import path from'path';

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async function() {

	//require.paths.push(process.cwd());
	let args = (process.ARGV || process.argv).slice(2);

	let files = [];

	let testrunner,
			config_file,
			config_param_found = false,
			output_param_found = false,
			reporter_file = 'default',
			reporter_param_found = false,
			testspec_param_found = false,
			testFullSpec_param_found = false;

	let usage = "Usage: nodeunit [options] testmodule1.js testfolder [...] \n" +
							"Options:\n\n" +
							"  --config FILE     the path to a JSON file with options\n" +
							"  --reporter FILE   optional path to a reporter file to customize the output\n" +
							"  --list-reporters  list available build-in reporters\n" +
							"  -r                recursively run tests in sub-directories\n" +
							"  -t testName,      specify a test to run\n" +
							"  -f fullTestName,  specify a specific test to run. fullTestName is built so: \"outerGroup - .. - innerGroup - testName\"\n"  +
							"  -h, --help        display this help and exit\n" +
							"  -v, --version     output version information and exit";



	// load default options
	let content = fs.readFileSync(__dirname + '/nodeunit.json', 'utf8');
	let options = JSON.parse(content);

	for(const arg of args) {
		if (arg.slice(0, 9) === "--config=") {
				config_file = arg.slice(9);
		} else if (arg === '--config') {
				config_param_found = true;
		} else if (config_param_found) {
				config_file = arg;
				config_param_found = false;
		} else if (arg.slice(0, 9) === "--output=") {
				options.output = arg.slice(9);
		} else if (arg === '--output') {
				output_param_found = true;
		} else if (output_param_found) {
				options.output = arg;
				output_param_found = false;
		} else if (arg.slice(0, 11) === "--reporter=") {
				reporter_file = arg.slice(11);
		} else if (arg === '--reporter') {
				reporter_param_found = true;
		} else if (reporter_param_found) {
				reporter_file = arg;
				reporter_param_found = false;
		} else if (arg === '-r') {
				options.recursive = true;
		} else if (arg === '-t') {
				testspec_param_found = true;
		} else if (testspec_param_found) {
				options.testspec = arg;
				testspec_param_found = false;
		} else if (arg === '-f') {
				testFullSpec_param_found = true;
		} else if (testFullSpec_param_found) {
				options.testFullSpec= arg;
				testFullSpec_param_found = false;
		} else if (arg === '--list-reporters') {
				let reporters = fs.readdirSync(__dirname + '/../lib/reporters');
				reporters = reporters.filter(function (reporter_file) {
						return (/\.js$/).test(reporter_file);
				}).map(function (reporter_file) {
						return reporter_file.replace(/\.js$/, '');
				}).filter(function (reporter_file) {
						return reporter_file !== 'index';
				});
				console.log('Built-in reporters: ');

				for(const reporter_file of reporters) {
					let reporter = await import('../lib/reporters/' + reporter_file);
					console.log('  * ' + reporter_file + (reporter.info ? ': ' + reporter.info : ''));
				}
				process.exit(0);
		} else if ((arg === '-v') || (arg === '--version')) {
				let content = fs.readFileSync(__dirname + '/../package.json', 'utf8');
				let pkg = JSON.parse(content);
				console.log(pkg.version);
				process.exit(0);
		} else if ((arg === '-h') || (arg === '--help')) {
				console.log(usage);
				process.exit(0);
		} else {
				files.push(arg);
		}
	}

	// defaults to `test`
	if (files.length === 0) {
			files = ['test'];
	}

	if (config_file) {
			content = fs.readFileSync(config_file, 'utf8');
			let custom_options = JSON.parse(content);

			for (let option in custom_options) {
					if (typeof option === 'string') {
							options[option] = custom_options[option];
					}
			}
	}

	testrunner = await import(`../lib/reporters/${reporter_file}.js`);

	testrunner.run(files, options, function(err) {
			process.exit(err ? 1 : 0);
	});

})()