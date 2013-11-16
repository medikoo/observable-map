'use strict';

var eIndexOf       = require('es5-ext/array/#/e-index-of')
  , i              = require('es5-ext/function/i')
  , invoke         = require('es5-ext/function/invoke')
  , validFunction  = require('es5-ext/function/valid-function')
  , d              = require('d/d')
  , memoize        = require('memoizee/lib/regular')
  , memMethods     = require('memoizee/lib/d')(memoize)
  , ReadOnly       = require('observable-set/create-read-only')(
	require('observable-set')
)
  , isObservableMap = require('./valid-observable-map')
  , defineProperties = Object.defineProperties
  , invokeDispose = invoke('_dispose');

require('memoizee/lib/ext/ref-counter');
require('memoizee/lib/ext/resolvers');
require('memoizee/lib/ext/dispose');

module.exports = memoize(function (ObservableMap) {
	validFunction(ObservableMap);
	if (!isObservableMap(new ObservableMap())) {
		throw new TypeError(ObservableMap + " is not observable set constructor");
	}
	defineProperties(ObservableMap.prototype, memMethods({
		toSet: d(function (kind) {
			var result, disposed, listener, registry, inClear;
			result = new ReadOnly((kind === 'value') ? this.values() : this.keys());
			if (kind === 'value') {
				registry = memoize(i, { refCounter: true, dispose: function (val) {
					if (inClear) return;
					result._delete(val);
				} });
				result.forEach(registry);
				this.on('change', listener = function (event) {
					var type = event.type, changed, valid;
					if (type === 'set') {
						if (event.hasOwnProperty('oldValue')) {
							registry.clearRef(event.oldValue);
						}
						result._add(registry(event.value));
					} else if (type === 'delete') {
						registry.clearRef(event.value);
					} else if (type === 'clear') {
						inClear = true;
						registry.clearAll();
						inClear = false;
						result._clear();
					} else {
						inClear = true;
						registry.clearAll();
						inClear = false;
						valid = [];
						this.forEach(function (value, key) {
							valid.push(registry(value));
							if (result.has(value)) return;
							result.$add(value);
							changed = true;
						});
						result.forEach(function (value) {
							if (eIndexOf.call(valid, value)) return;
							result.$delete(value);
							changed = true;
						});
						if (changed) result.emit('change', {});
					}
				});
			} else {
				this.on('change', listener = function (event) {
					var type = event.type, changed;
					if (type === 'set') {
						result._add(event.key);
					} else if (type === 'delete') {
						result._delete(event.key);
					} else if (type === 'clear') {
						result._clear();
					} else {
						this.forEach(function (value, key) {
							if (result.has(key)) return;
							result.$add(key);
							changed = true;
						});
						result.forEach(function (value) {
							if (this.has(value)) return;
							result.$delete(value);
							changed = true;
						}, this);
						if (changed) result.emit('change', {});
					}
				});
			}
			defineProperties(result, {
				unref: d(function () {
					if (disposed) return;
					this.toSet.clearRef(kind);
				}.bind(this)),
				_dispose: d(function () {
					this.off('change', listener);
					if (registry) registry.clearAll();
					disposed = true;
				}.bind(this))
			});
			return result;
		}, { resolvers: [function (kind) {
			return (String(kind) === 'key') ? 'key' : 'value';
		}], refCounter: true, dispose: invokeDispose })
	}));

	return ObservableMap;
});
