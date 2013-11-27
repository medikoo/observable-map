'use strict';

var aFrom              = require('es5-ext/array/from')
  , invoke             = require('es5-ext/function/invoke')
  , validFunction      = require('es5-ext/function/valid-function')
  , eq                 = require('es5-ext/object/eq')
  , callable           = require('es5-ext/object/valid-callable')
  , value              = require('es5-ext/object/valid-value')
  , d                  = require('d/d')
  , memoize            = require('memoizee/lib/regular')
  , memMethods         = require('memoizee/lib/d')(memoize)
  , isIterable         = require('es6-iterator/is-iterable')
  , Set                = require('es6-set')
  , isSet              = require('es6-set/is-set')
  , isObservableSet    = require('observable-set/is-observable-set')
  , createReadOnly     = require('./create-read-only')
  , validObservableMap = require('./valid-observable-map')

  , bind = Function.prototype.bind
  , defineProperties = Object.defineProperties
  , invokeDispose = invoke('_dispose');

require('memoizee/lib/ext/ref-counter');
require('memoizee/lib/ext/dispose');

module.exports = memoize(function (ObservableMap) {
	var ReadOnly;

	validFunction(ObservableMap);
	validObservableMap(ObservableMap.prototype);
	ReadOnly = createReadOnly(ObservableMap);

	defineProperties(ObservableMap.prototype, memMethods({
		filter: d(function (callbackFn/*, thisArg*/) {
			var result, thisArg, cb, disposed, listener;
			(value(this) && callable(callbackFn));
			thisArg = arguments[1];
			cb = memoize(bind.call(callbackFn, thisArg), { length: 2 });
			result = new ReadOnly();
			this.on('change', listener = function (event) {
				var type = event.type;
				if (type === 'set') {
					if (cb(event.value, event.key)) result._set(event.key, event.value);
					else if (result.has(event.key)) result._delete(event.key);
					return;
				}
				if (type === 'delete') {
					result._delete(event.key);
					return;
				}
				if (type === 'clear') {
					result._clear();
					return;
				}
				result._postponed_ += 1;
				if (type === 'batch') {
					if (event.set) {
						event.set.forEach(function (value, key) {
							if (cb(value, key)) result._set(key, value);
							else result._delete(key);
						});
					}
					if (event.deleted) {
						event.deleted.forEach(function (value, key) {
							if (event.set && event.set.has(key)) return;
							result._delete(key);
						});
					}
				} else {
					result.forEach(function (value, key) {
						if (this.has(key)) {
							if (eq(this.get(key), value)) return;
							if (cb(value, key)) {
								result._set(key, value);
								return;
							}
						}
						result._delete(key);
					}, this);
					this.forEach(function (value, key) {
						if (cb(value, key)) {
							if (result.has(key) && eq(result.get(key), value)) return;
							result._set(key, value);
							return;
						}
						if (!result.has(value)) return;
						result._delete(value);
					}, this);
				}
				result._postponed_ -= 1;
			}.bind(this));
			this.forEach(function (value, key) {
				if (cb(value, key)) result.$set(key, value);
			});
			defineProperties(result, {
				refresh: d(function (key) {
					var value;
					if (!this.has(key)) return;
					value = this.get(key);
					cb.clear(value, key);
					if (cb(value, key)) result._set(key, value);
					else result._delete(key);
				}.bind(this)),
				refreshAll: d(function () {
					cb.clearAll();
					this.forEach(function (value, key) {
						if (cb(value, key)) result._set(key, value);
						else result._delete(key);
					});
				}.bind(this)),
				unref: d(function () {
					if (disposed) return;
					this.filter.clearRef(callbackFn, thisArg);
				}.bind(this)),
				_dispose: d(function () {
					this.off('change', listener);
					disposed = true;
				}.bind(this))
			});
			return result;
		}, { length: 2, refCounter: true, dispose: invokeDispose }),

		map: d(function (callbackFn/*, thisArg*/) {
			var result, thisArg, cb, disposed, listener;
			(value(this) && callable(callbackFn));
			thisArg = arguments[1];
			cb = memoize(bind.call(callbackFn, thisArg), { length: 2 });
			result = new ReadOnly();
			this.on('change', listener = function (event) {
				var type = event.type;
				if (type === 'set') {
					result._set(event.key, cb(event.value, event.key));
					return;
				}
				if (type === 'delete') {
					result._delete(event.key);
					return;
				}
				if (type === 'clear') {
					result._clear();
					return;
				}
				result._postponed_ += 1;
				if (type === 'batch') {
					if (event.set) {
						event.set.forEach(function (value, key) {
							result._set(key, cb(value, key));
						});
					}
					if (event.deleted) {
						event.deleted.forEach(function (value, key) {
							if (event.set && event.set.has(key)) return;
							result._delete(key);
						}, this);
					}
				} else {
					this.forEach(function (value, key) {
						value = cb(value, key);
						if (result.has(key) && eq(result.get(key), value)) return;
						result._set(key, value);
					});
					result.forEach(function (value, key) {
						if (this.has(key)) return;
						result._delete(key);
					}, this);
				}
				result._postponed_ -= 1;
			}.bind(this));
			this.forEach(function (value, key) { result.$set(key, cb(value, key)); });
			defineProperties(result, {
				refresh: d(function (key) {
					var value, old, nu;
					if (!this.has(key)) return;
					value = this.get(key);
					old = cb(value, key);
					cb.clear(value, key);
					nu = cb(value, key);
					if (eq(old, nu)) return;
					result._set(key, nu);
				}.bind(this)),
				refreshAll: d(function () {
					result._postponed_ += 1;
					this.forEach(function (value, key) {
						var old = cb(value, key), nu;
						cb.clear(value, key);
						nu = cb(value, key);
						if (eq(old, nu)) return;
						result._set(key, nu);
					}, this);
					result._postponed_ -= 1;
				}.bind(this)),
				unref: d(function () {
					if (disposed) return;
					this.map.clearRef(callbackFn, thisArg);
				}.bind(this)),
				_dispose: d(function () {
					this.off('change', listener);
					disposed = true;
				}.bind(this))
			});
			return result;
		}, { length: 2, refCounter: true, dispose: invokeDispose }),

		subset: d(function (values) {
			var result, disposed, listener, valuesListener;
			value(values);
			if (isSet(values)) {
				if (isObservableSet(values)) {
					values.on('change', valuesListener = function (event) {
						var type = event.type;
						if (type === 'add') {
							if (!this.has(event.value)) return;
							result._set(event.value, this.get(event.value));
							return;
						}
						if (type === 'delete') {
							if (this.has(event.value)) result._delete(event.value);
							return;
						}
						if (type === 'clear') {
							result._clear();
							return;
						}
						result._postponed_ += 1;
						if (type === 'batch') {
							if (event.added) {
								event.added.forEach(function (value) {
									if (!this.has(value)) return;
									result._set(value, this.get(value));
								}, this);
							}
							if (event.deleted) {
								event.deleted.forEach(function (value) {
									if (!this.has(value)) return;
									result._delete(value);
								}, this);
							}
						} else {
							result.forEach(function (value, key) {
								if (values.has(key)) return;
								result._delete(key);
							}.bind(this));
							this.forEach(function (value, key) {
								if (values.has(key) && result.has(key)) return;
								result._set(key, value);
							});
						}
						result._postponed_ -= 1;
					}.bind(this));
				}
			} else if (isIterable(values)) {
				values = new Set(values);
			} else {
				values = new Set(aFrom(values));
			}
			result = new ReadOnly();
			this.on('change', listener = function (event) {
				var type = event.type;
				if (type === 'set') {
					if (values.has(event.key)) result._set(event.key, event.value);
					return;
				}
				if (type === 'delete') {
					result._delete(event.key);
					return;
				}
				if (type === 'clear') {
					result._clear();
					return;
				}
				result._postponed_ += 1;
				if (type === 'batch') {
					if (event.set) {
						event.set.forEach(function (value, key) {
							if (!values.has(key)) return;
							result._set(key, value);
						}, this);
					}
					if (event.deleted) {
						event.deleted.forEach(function (value, key) {
							if (event.set && event.set.has(key)) return;
							result._delete(key);
						}, this);
					}
				} else {
					result.forEach(function (value, key) {
						if (this.has(key)) {
							if (eq(this.get(key), value)) return;
							result._set(key, value);
							return;
						}
						result._delete(key);
					}, this);
					this.forEach(function (value, key) {
						if (!values.has(key) || result.has(key)) return;
						result._set(key, value);
					}, this);
				}
				result._postponed_ -= 1;
			}.bind(this));
			this.forEach(function (value, key) {
				if (values.has(key)) result.$set(key, value);
			});
			defineProperties(result, {
				unref: d(function () {
					if (disposed) return;
					this.subset.clearRef(values);
				}.bind(this)),
				_dispose: d(function () {
					this.off('change', listener);
					if (valuesListener) values.off('change', valuesListener);
					disposed = true;
				}.bind(this))
			});
			return result;
		}, { length: 1, refCounter: true, dispose: invokeDispose })
	}));

	return ObservableMap;
});
