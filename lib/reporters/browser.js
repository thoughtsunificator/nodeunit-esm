/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 *
 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 * You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 * Only code on that line will be removed, its mostly to avoid requiring code
 * that is node specific
 */


/**
 * NOTE: this test runner is not listed in index.js because it cannot be
 * used with the command-line tool, only inside the browser.
 */


/**
 * Reporter info string
 */

export const info = "Browser-based test reporter";


/**
 * Run all tests within each module, reporting the results
 *
 * @param {Array} files
 * @api public
 */

export const run = function (modules, options, callback) {
		let start = new Date().getTime(), div, textareas, displayErrorsByDefault;
		options = options || {};
		div = options.div || document.body;
		textareas = options.textareas;
		displayErrorsByDefault = options.displayErrorsByDefault;

		function setText(el, txt) {
				if ('innerText' in el) {
						el.innerText = txt;
				}
				else if ('textContent' in el){
						el.textContent = txt;
				}
		}

		function getOrCreate(tag, id) {
				let el = document.getElementById(id);
				if (!el) {
						el = document.createElement(tag);
						el.id = id;
						div.appendChild(el);
				}
				return el;
		};

		let header = getOrCreate('h1', 'nodeunit-header');
		let banner = getOrCreate('h2', 'nodeunit-banner');
		let userAgent = getOrCreate('h2', 'nodeunit-userAgent');
		let tests = getOrCreate('ol', 'nodeunit-tests');
		let result = getOrCreate('p', 'nodeunit-testresult');

		setText(userAgent, navigator.userAgent);

		nodeunit.runModules(modules, {
				moduleStart: function (name) {
						/*let mheading = document.createElement('h2');
						mheading.innerText = name;
						results.appendChild(mheading);
						module = document.createElement('ol');
						results.appendChild(module);*/
				},
				testDone: function (name, assertions) {
						let test = document.createElement('li');
						let strong = document.createElement('strong');
						strong.innerHTML = name + ' <b style="color: black;">(' +
								'<b class="fail">' + assertions.failures() + '</b>, ' +
								'<b class="pass">' + assertions.passes() + '</b>, ' +
								assertions.length +
						')</b>';
						test.className = assertions.failures() ? 'fail': 'pass';
						test.appendChild(strong);

						let aList = document.createElement('ol');
						aList.style.display = displayErrorsByDefault ? 'block' : 'none';
						(displayErrorsByDefault ? strong : test).onclick = function () {
								let d = aList.style.display;
								aList.style.display = (d == 'none') ? 'block': 'none';
						};
						for (let i=0; i<assertions.length; i++) {
								let li = document.createElement('li');
								let a = assertions[i];
								if (a.failed()) {
										li.innerHTML = (a.message || a.method || 'no message') +
												(textareas ?
													'<textarea rows="20" cols="100">' + (a.error.stack || a.error) + '</textarea>' :
													'<pre>' + (a.error.stack || a.error) + '</pre>');
										li.className = 'fail';
								}
								else {
										li.innerHTML = a.message || a.method || 'no message';
										li.className = 'pass';
								}
								aList.appendChild(li);
						}
						test.appendChild(aList);
						tests.appendChild(test);
				},
				done: function (assertions) {
						let end = new Date().getTime();
						let duration = end - start;

						let failures = assertions.failures();
						banner.className = failures ? 'fail': 'pass';

						result.innerHTML = 'Tests completed in ' + duration +
								' milliseconds.<br/><span class="passed">' +
								assertions.passes() + '</span> assertions of ' +
								'<span class="all">' + assertions.length + '<span> passed, ' +
								assertions.failures() + ' failed.';

						if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
				}
		});
};
