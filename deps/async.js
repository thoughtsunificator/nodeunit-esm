/*global setTimeout: false, console: false */

let async = {};

// // global on the server, window in the browser
// let root = this,
// 		previous_async = root.async;

// if (typeof module !== 'undefined' && module.exports) {
// 		module.exports = async;
// }
// else {
// 		root.async = async;
// }

async.noConflict = function () {
		root.async = previous_async;
		return async;
};

//// cross-browser compatiblity functions ////

let _forEach = function (arr, iterator) {
		if (arr.forEach) {
				return arr.forEach(iterator);
		}
		for (let i = 0; i < arr.length; i += 1) {
				iterator(arr[i], i, arr);
		}
};

let _map = function (arr, iterator) {
		if (arr.map) {
				return arr.map(iterator);
		}
		let results = [];
		_forEach(arr, function (x, i, a) {
				results.push(iterator(x, i, a));
		});
		return results;
};

let _reduce = function (arr, iterator, memo) {
		if (arr.reduce) {
				return arr.reduce(iterator, memo);
		}
		_forEach(arr, function (x, i, a) {
				memo = iterator(memo, x, i, a);
		});
		return memo;
};

let _keys = function (obj) {
		if (Object.keys) {
				return Object.keys(obj);
		}
		let keys = [];
		for (let k in obj) {
				if (obj.hasOwnProperty(k)) {
						keys.push(k);
				}
		}
		return keys;
};

let _indexOf = function (arr, item) {
		if (arr.indexOf) {
				return arr.indexOf(item);
		}
		for (let i = 0; i < arr.length; i += 1) {
				if (arr[i] === item) {
						return i;
				}
		}
		return -1;
};

//// exported async module functions ////

//// nextTick implementation with browser-compatible fallback ////
if (typeof setImmediate === 'function') {
		async.nextTick = function (fn) {
				setImmediate(fn);
		};
}
else if (typeof process !== 'undefined' && process.nextTick) {
		async.nextTick = process.nextTick;
}
else {
		async.nextTick = function (fn) {
				setTimeout(fn, 0);
		};
}

async.forEach = function (arr, iterator, callback) {
		if (!arr.length) {
				return callback();
		}
		let completed = 0;
		_forEach(arr, function (x) {
				iterator(x, function (err) {
						if (err) {
								callback(err);
								callback = function () {};
						}
						else {
								completed += 1;
								if (completed === arr.length) {
										callback();
								}
						}
				});
		});
};

async.forEachSeries = function (arr, iterator, callback) {
		if (!arr.length) {
				return callback();
		}
		let completed = 0;
		let iterate = function () {
				iterator(arr[completed], function (err) {
						if (err) {
								callback(err);
								callback = function () {};
						}
						else {
								completed += 1;
								if (completed === arr.length) {
										callback();
								}
								else {
										iterate();
								}
						}
				});
		};
		iterate();
};


let doParallel = function (fn) {
		return function () {
				let args = Array.prototype.slice.call(arguments);
				return fn.apply(null, [async.forEach].concat(args));
		};
};
let doSeries = function (fn) {
		return function () {
				let args = Array.prototype.slice.call(arguments);
				return fn.apply(null, [async.forEachSeries].concat(args));
		};
};


let _asyncMap = function (eachfn, arr, iterator, callback) {
		let results = [];
		arr = _map(arr, function (x, i) {
				return {index: i, value: x};
		});
		eachfn(arr, function (x, callback) {
				iterator(x.value, function (err, v) {
						results[x.index] = v;
						callback(err);
				});
		}, function (err) {
				callback(err, results);
		});
};
async.map = doParallel(_asyncMap);
async.mapSeries = doSeries(_asyncMap);


// reduce only has a series version, as doing reduce in parallel won't
// work in many situations.
async.reduce = function (arr, memo, iterator, callback) {
		async.forEachSeries(arr, function (x, callback) {
				iterator(memo, x, function (err, v) {
						memo = v;
						callback(err);
				});
		}, function (err) {
				callback(err, memo);
		});
};
// inject alias
async.inject = async.reduce;
// foldl alias
async.foldl = async.reduce;

async.reduceRight = function (arr, memo, iterator, callback) {
		let reversed = _map(arr, function (x) {
				return x;
		}).reverse();
		async.reduce(reversed, memo, iterator, callback);
};
// foldr alias
async.foldr = async.reduceRight;

let _filter = function (eachfn, arr, iterator, callback) {
		let results = [];
		arr = _map(arr, function (x, i) {
				return {index: i, value: x};
		});
		eachfn(arr, function (x, callback) {
				iterator(x.value, function (v) {
						if (v) {
								results.push(x);
						}
						callback();
				});
		}, function (err) {
				callback(_map(results.sort(function (a, b) {
						return a.index - b.index;
				}), function (x) {
						return x.value;
				}));
		});
};
async.filter = doParallel(_filter);
async.filterSeries = doSeries(_filter);
// select alias
async.select = async.filter;
async.selectSeries = async.filterSeries;

let _reject = function (eachfn, arr, iterator, callback) {
		let results = [];
		arr = _map(arr, function (x, i) {
				return {index: i, value: x};
		});
		eachfn(arr, function (x, callback) {
				iterator(x.value, function (v) {
						if (!v) {
								results.push(x);
						}
						callback();
				});
		}, function (err) {
				callback(_map(results.sort(function (a, b) {
						return a.index - b.index;
				}), function (x) {
						return x.value;
				}));
		});
};
async.reject = doParallel(_reject);
async.rejectSeries = doSeries(_reject);

let _detect = function (eachfn, arr, iterator, main_callback) {
		eachfn(arr, function (x, callback) {
				iterator(x, function (result) {
						if (result) {
								main_callback(x);
						}
						else {
								callback();
						}
				});
		}, function (err) {
				main_callback();
		});
};
async.detect = doParallel(_detect);
async.detectSeries = doSeries(_detect);

async.some = function (arr, iterator, main_callback) {
		async.forEach(arr, function (x, callback) {
				iterator(x, function (v) {
						if (v) {
								main_callback(true);
								main_callback = function () {};
						}
						callback();
				});
		}, function (err) {
				main_callback(false);
		});
};
// any alias
async.any = async.some;

async.every = function (arr, iterator, main_callback) {
		async.forEach(arr, function (x, callback) {
				iterator(x, function (v) {
						if (!v) {
								main_callback(false);
								main_callback = function () {};
						}
						callback();
				});
		}, function (err) {
				main_callback(true);
		});
};
// all alias
async.all = async.every;

async.sortBy = function (arr, iterator, callback) {
		async.map(arr, function (x, callback) {
				iterator(x, function (err, criteria) {
						if (err) {
								callback(err);
						}
						else {
								callback(null, {value: x, criteria: criteria});
						}
				});
		}, function (err, results) {
				if (err) {
						return callback(err);
				}
				else {
						let fn = function (left, right) {
								let a = left.criteria, b = right.criteria;
								return a < b ? -1 : a > b ? 1 : 0;
						};
						callback(null, _map(results.sort(fn), function (x) {
								return x.value;
						}));
				}
		});
};

async.auto = function (tasks, callback) {
		callback = callback || function () {};
		let keys = _keys(tasks);
		if (!keys.length) {
				return callback(null);
		}

		let completed = [];

		let listeners = [];
		let addListener = function (fn) {
				listeners.unshift(fn);
		};
		let removeListener = function (fn) {
				for (let i = 0; i < listeners.length; i += 1) {
						if (listeners[i] === fn) {
								listeners.splice(i, 1);
								return;
						}
				}
		};
		let taskComplete = function () {
				_forEach(listeners, function (fn) {
						fn();
				});
		};

		addListener(function () {
				if (completed.length === keys.length) {
						callback(null);
				}
		});

		_forEach(keys, function (k) {
				let task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
				let taskCallback = function (err) {
						if (err) {
								callback(err);
								// stop subsequent errors hitting callback multiple times
								callback = function () {};
						}
						else {
								completed.push(k);
								taskComplete();
						}
				};
				let requires = task.slice(0, Math.abs(task.length - 1)) || [];
				let ready = function () {
						return _reduce(requires, function (a, x) {
								return (a && _indexOf(completed, x) !== -1);
						}, true);
				};
				if (ready()) {
						task[task.length - 1](taskCallback);
				}
				else {
						let listener = function () {
								if (ready()) {
										removeListener(listener);
										task[task.length - 1](taskCallback);
								}
						};
						addListener(listener);
				}
		});
};

async.waterfall = function (tasks, callback) {
		if (!tasks.length) {
				return callback();
		}
		callback = callback || function () {};
		let wrapIterator = function (iterator) {
				return function (err) {
						if (err) {
								callback(err);
								callback = function () {};
						}
						else {
								let args = Array.prototype.slice.call(arguments, 1);
								let next = iterator.next();
								if (next) {
										args.push(wrapIterator(next));
								}
								else {
										args.push(callback);
								}
								async.nextTick(function () {
										iterator.apply(null, args);
								});
						}
				};
		};
		wrapIterator(async.iterator(tasks))();
};

async.parallel = function (tasks, callback) {
		callback = callback || function () {};
		if (tasks.constructor === Array) {
				async.map(tasks, function (fn, callback) {
						if (fn) {
								fn(function (err) {
										let args = Array.prototype.slice.call(arguments, 1);
										if (args.length <= 1) {
												args = args[0];
										}
										callback.call(null, err, args || null);
								});
						}
				}, callback);
		}
		else {
				let results = {};
				async.forEach(_keys(tasks), function (k, callback) {
						tasks[k](function (err) {
								let args = Array.prototype.slice.call(arguments, 1);
								if (args.length <= 1) {
										args = args[0];
								}
								results[k] = args;
								callback(err);
						});
				}, function (err) {
						callback(err, results);
				});
		}
};

async.series = function (tasks, callback) {
		callback = callback || function () {};
		if (tasks.constructor === Array) {
				async.mapSeries(tasks, function (fn, callback) {
						if (fn) {
								fn(function (err) {
										let args = Array.prototype.slice.call(arguments, 1);
										if (args.length <= 1) {
												args = args[0];
										}
										callback.call(null, err, args || null);
								});
						}
				}, callback);
		}
		else {
				let results = {};
				async.forEachSeries(_keys(tasks), function (k, callback) {
						tasks[k](function (err) {
								let args = Array.prototype.slice.call(arguments, 1);
								if (args.length <= 1) {
										args = args[0];
								}
								results[k] = args;
								callback(err);
						});
				}, function (err) {
						callback(err, results);
				});
		}
};

async.iterator = function (tasks) {
		let makeCallback = function (index) {
				let fn = function () {
						if (tasks.length) {
								tasks[index].apply(null, arguments);
						}
						return fn.next();
				};
				fn.next = function () {
						return (index < tasks.length - 1) ? makeCallback(index + 1): null;
				};
				return fn;
		};
		return makeCallback(0);
};

async.apply = function (fn) {
		let args = Array.prototype.slice.call(arguments, 1);
		return function () {
				return fn.apply(
						null, args.concat(Array.prototype.slice.call(arguments))
				);
		};
};

let _concat = function (eachfn, arr, fn, callback) {
		let r = [];
		eachfn(arr, function (x, cb) {
				fn(x, function (err, y) {
						r = r.concat(y || []);
						cb(err);
				});
		}, function (err) {
				callback(err, r);
		});
};
async.concat = doParallel(_concat);
async.concatSeries = doSeries(_concat);

async.whilst = function (test, iterator, callback) {
		if (test()) {
				iterator(function (err) {
						if (err) {
								return callback(err);
						}
						async.whilst(test, iterator, callback);
				});
		}
		else {
				callback();
		}
};

async.until = function (test, iterator, callback) {
		if (!test()) {
				iterator(function (err) {
						if (err) {
								return callback(err);
						}
						async.until(test, iterator, callback);
				});
		}
		else {
				callback();
		}
};

async.queue = function (worker, concurrency) {
		let workers = 0;
		let tasks = [];
		let q = {
				concurrency: concurrency,
				push: function (data, callback) {
						tasks.push({data: data, callback: callback});
						async.nextTick(q.process);
				},
				process: function () {
						if (workers < q.concurrency && tasks.length) {
								let task = tasks.splice(0, 1)[0];
								workers += 1;
								worker(task.data, function () {
										workers -= 1;
										if (task.callback) {
												task.callback.apply(task, arguments);
										}
										q.process();
								});
						}
				},
				length: function () {
						return tasks.length;
				}
		};
		return q;
};

let _console_fn = function (name) {
		return function (fn) {
				let args = Array.prototype.slice.call(arguments, 1);
				fn.apply(null, args.concat([function (err) {
						let args = Array.prototype.slice.call(arguments, 1);
						if (typeof console !== 'undefined') {
								if (err) {
										if (console.error) {
												console.error(err);
										}
								}
								else if (console[name]) {
										_forEach(args, function (x) {
												console[name](x);
										});
								}
						}
				}]));
		};
};
async.log = _console_fn('log');
async.dir = _console_fn('dir');
/*async.info = _console_fn('info');
async.warn = _console_fn('warn');
async.error = _console_fn('error');*/

async.memoize = function (fn, hasher) {
		let memo = {};
		hasher = hasher || function (x) {
				return x;
		};
		return function () {
				let args = Array.prototype.slice.call(arguments);
				let callback = args.pop();
				let key = hasher.apply(null, args);
				if (key in memo) {
						callback.apply(null, memo[key]);
				}
				else {
						fn.apply(null, args.concat([function () {
								memo[key] = arguments;
								callback.apply(null, arguments);
						}]));
				}
		};
};

export default async;
