'use strict';

var aFrom           = require('es5-ext/array/from')
  , invoke          = require('es5-ext/function/invoke')
  , validFunction   = require('es5-ext/function/valid-function')
  , eq              = require('es5-ext/object/eq')
  , callable        = require('es5-ext/object/valid-callable')
  , value           = require('es5-ext/object/valid-value')
  , d               = require('d/d')
  , memoize         = require('memoizee/lib/regular')
  , memMethods      = require('memoizee/lib/d')(memoize)
  , isIterable      = require('es6-iterator/is-iterable')
  , Set             = require('es6-set')
  , isSet           = require('es6-set/is-set')
  , isObservableSet = require('observable-set/is-observable-set')
  , createReadOnly  = require('./create-read-only')
  , isObservableMap = require('./is-observable-map')

  , bind = Function.prototype.bind
  , defineProperties = Object.defineProperties
  , invokeDispose = invoke('_dispose');

require('memoizee/lib/ext/ref-counter');
require('memoizee/lib/ext/dispose');

module.exports = memoize(function (ObservableMap) {
	var ReadOnly;
	validFunction(ObservableMap);
	if (!isObservableMap(ObservableMap.prototype)) {
		throw new TypeError(ObservableMap + " is not observable map constructor");
	}
	ReadOnly = createReadOnly(ObservableMap);
	defineProperties(ObservableMap.prototype, memMethods({
		filter: d(function (callbackFn/*, thisArg*/) {
			var result, thisArg, cb, disposed, listener;
			(value(this) && callable(callbackFn));
			thisArg = arguments[1];
			cb = memoize(bind.call(callbackFn, thisArg), { length: 2 });
			result = new ReadOnly();
			this.on('change', listener = function (event) {
				var type = event.type, changed;
				if (type === 'set') {
					if (cb(event.value, event.key)) result._set(event.key, event.value);
					else if (result.has(event.key)) result._delete(event.key);
				} else if (type === 'delete') {
					result._delete(event.key);
				} else if (type === 'clear') {
					result._clear();
				} else {
					result.forEach(function (value, key) {
						if (this.has(key)) {
							if (eq(this.get(key), value)) return;
							if (cb(value, key)) {
								result.$set(key, value);
								changed = true;
								return;
							}
						}
						result.$delete(key);
						changed = true;
					}, this);
					this.forEach(function (value, key) {
						if (cb(value, key)) {
							if (result.has(key) && eq(result.get(key), value)) return;
							result.$set(key, value);
							changed = true;
							return;
						}
						if (!result.has(value)) return;
						result.$delete(value);
						changed = true;
					}, this);
					if (changed) result.emit('change', {});
				}
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
				var type = event.type, changed;
				if (type === 'set') {
					result._set(event.key, cb(event.value, event.key));
				} else if (type === 'delete') {
					result._delete(event.key);
				} else if (type === 'clear') {
					result._clear();
				} else {
					this.forEach(function (value, key) {
						value = cb(value, key);
						if (result.has(key) && eq(result.get(key), value)) return;
						result.$set(key, value);
						changed = true;
					});
					result.forEach(function (value, key) {
						if (this.has(key)) return;
						result.$delete(key);
						changed = true;
					}, this);
					if (changed) result.emit('change', {});
				}
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
					var changed;
					this.forEach(function (value, key) {
						var old = cb(value, key), nu;
						cb.clear(value, key);
						nu = cb(value, key);
						if (eq(old, nu)) return;
						result.$set(key, nu);
						changed = true;
					}, this);
					if (changed) result.emit('change', {});
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
						var type = event.type, changed;
						if (type === 'add') {
							if (this.has(event.value)) {
								result._set(event.value, this.get(event.value));
							}
						} else if (type === 'delete') {
							if (this.has(event.value)) result._delete(event.value);
						} else if (type === 'clear') {
							result._clear();
						} else {
							result.forEach(function (value, key) {
								if (values.has(key)) return;
								result.$delete(key);
								changed = true;
							}.bind(this));
							this.forEach(function (value, key) {
								if (values.has(key) && result.has(key)) return;
								result.$set(key, value);
								changed = true;
							});
							if (changed) result.emit('change', {});
						}
					}.bind(this));
				}
			} else if (isIterable(values)) {
				values = new Set(values);
			} else {
				values = new Set(aFrom(values));
			}
			result = new ReadOnly();
			this.on('change', listener = function (event) {
				var type = event.type, changed;
				if (type === 'set') {
					if (values.has(event.key)) result._set(event.key, event.value);
				} else if (type === 'delete') {
					result._delete(event.key);
				} else if (type === 'clear') {
					result._clear();
				} else {
					result.forEach(function (value, key) {
						if (this.has(key)) {
							if (eq(this.get(key), value)) return;
							result.$set(key, value);
							changed = true;
							return;
						}
						result.$delete(key);
						changed = true;
					}, this);
					this.forEach(function (value, key) {
						if (!values.has(key) || result.has(key)) return;
						result.$set(key, value);
						changed = true;
					}, this);
					if (changed) result.emit('change', {});
				}
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
