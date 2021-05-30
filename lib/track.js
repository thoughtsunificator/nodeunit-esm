/*!
 * Simple util module to track tests. Adds a process.exit hook to print
 * the undone tests.
 */

export const createTracker = function (on_exit) {
		let names = {};
		let tracker = {
				names: function () {
						let arr = [];
						for (let k in names) {
								if (names.hasOwnProperty(k)) {
										arr.push(k);
								}
						}
						return arr;
				},
				unfinished: function () {
						return tracker.names().length;
				},
				put: function (testname) {
						names[testname] = testname;
				},
				remove: function (testname) {
						delete names[testname];
				}
		};

		process.on('exit', function() {
				on_exit = on_exit || default_on_exit;
				on_exit(tracker);
		});

		return tracker;
};

export const default_on_exit = function (tracker) {
		if (tracker.unfinished()) {
				console.log('');
				console.log('Undone tests (or their setups/teardowns): ');
				let names = tracker.names();
				for (let i = 0; i < names.length; i += 1) {
						console.log(names[i]);
				}
				process.reallyExit(tracker.unfinished());
		}
};
