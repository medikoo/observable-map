'use strict';

var eIndexOf           = require('es5-ext/array/#/e-index-of')
  , identity           = require('es5-ext/function/identity')
  , invoke             = require('es5-ext/function/invoke')
  , d                  = require('d')
  , memoize            = require('memoizee/plain')
  , memoizeMethods     = require('memoizee/methods-plain')
  , getNormalizer      = require('memoizee/normalizers/get-1')
  , ReadOnly           = require('observable-set/create-read-only')(require('observable-set'))
  , validObservableMap = require('./valid-observable-map')

  , defineProperties = Object.defineProperties
  , invokeDispose = invoke('_dispose');

require('memoizee/ext/ref-counter');
require('memoizee/ext/dispose');

module.exports = memoize(function (prototype) {
	validObservableMap(prototype);

	return defineProperties(prototype, memoizeMethods({
		toSet: d(function (kind) {
			var result, disposed, listener, registry, inClear;
			result = new ReadOnly((kind === 'value') ? this.values() : this.keys());
			if (kind === 'value') {
				registry = memoize(identity, {
					refCounter: true,
					dispose: function (val) {
						if (inClear) return;
						result._delete(val);
					},
					normalizer: getNormalizer()
				});
				result.forEach(registry);
				this.on('change', listener = function (event) {
					var type = event.type, valid;
					if (type === 'set') {
						if (event.hasOwnProperty('oldValue')) {
							registry.deleteRef(event.oldValue);
						}
						result._add(registry(event.value));
						return;
					}
					if (type === 'delete') {
						registry.deleteRef(event.value);
						return;
					}
					if (type === 'clear') {
						inClear = true;
						registry.clear();
						inClear = false;
						result._clear();
						return;
					}
					result._postponed_ += 1;
					if (type === 'batch') {
						if (event.set) {
							event.set.forEach(function (value) {
								result._add(registry(value));
							});
						}
						if (event.deleted) {
							event.deleted.forEach(function (value) {
								registry.deleteRef(value);
							});
						}
					} else {
						inClear = true;
						registry.clear();
						inClear = false;
						valid = [];
						this.forEach(function (value, key) {
							valid.push(registry(value));
							if (result.has(value)) return;
							result._add(value);
						});
						result.forEach(function (value) {
							if (eIndexOf.call(valid, value)) return;
							result._delete(value);
						});
					}
					result._postponed_ -= 1;
				});
			} else {
				this.on('change', listener = function (event) {
					var type = event.type;
					if (type === 'set') {
						result._add(event.key);
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
								result._add(key);
							});
						}
						if (event.deleted) {
							event.deleted.forEach(function (value, key) {
								if (event.set && event.set.has(key)) return;
								result._delete(key);
							});
						}
					} else {
						this.forEach(function (value, key) {
							if (result.has(key)) return;
							result._add(key);
						});
						result.forEach(function (value) {
							if (this.has(value)) return;
							result._delete(value);
						}, this);
					}
					result._postponed_ -= 1;
				});
			}
			defineProperties(result, {
				unref: d(function () {
					if (disposed) return;
					this.toSet.deleteRef(kind);
				}.bind(this)),
				_dispose: d(function () {
					this.off('change', listener);
					if (registry) registry.clear();
					disposed = true;
				}.bind(this))
			});
			return result;
		}, { resolvers: [function (kind) {
			return (String(kind) === 'key') ? 'key' : 'value';
		}], refCounter: true, dispose: invokeDispose })
	}));
}, { normalizer: getNormalizer() });
