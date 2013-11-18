'use strict';

var validFunction      = require('es5-ext/function/valid-function')
  , eq                 = require('es5-ext/object/eq')
  , setPrototypeOf     = require('es5-ext/object/set-prototype-of')
  , d                  = require('d/d')
  , ee                 = require('event-emitter')
  , memoize            = require('memoizee/lib/regular')
  , isMap              = require('es6-map/is-map')
  , isObservableSymbol = require('observable-value/symbol-is-observable')

  , defineProperty = Object.defineProperty;

module.exports = memoize(function (Constructor) {
	var Observable, clear, del, set;

	validFunction(Constructor);
	if (!isMap(Constructor.prototype)) {
		throw new TypeError(Constructor + " is not map constructor");
	}
	Observable = function (/* iterable, comparator */) {
		if (!(this instanceof Observable)) {
			return new Observable(arguments[0], arguments[1]);
		}
		Constructor.apply(this, arguments);
	};
	if (setPrototypeOf) setPrototypeOf(Observable, Constructor);

	clear = Constructor.prototype.clear;
	del = Constructor.prototype.delete;
	set = Constructor.prototype.set;

	Observable.prototype = ee(Object.create(Constructor.prototype, {
		constructor: d(Observable),
		clear: d(function () {
			if (!this.size) return;
			clear.call(this);
			this.emit('change', { type: 'clear' });
		}),
		$clear: d(clear),
		delete: d(function (key) {
			var has = this.has(key), value;
			if (has) value = this.get(key);
			else return false;
			del.call(this, key);
			this.emit('change', { type: 'delete', key: key, value: value });
			return true;
		}),
		$delete: d(del),
		set: d(function (key, value) {
			var oldValue, has, event;
			if (this.has(key)) {
				has = true;
				oldValue = this.get(key);
				if (eq(oldValue, value)) return this;
			}
			set.call(this, key, value);
			event = { type: 'set', key: key, value: value };
			if (has) event.oldValue = oldValue;
			this.emit('change', event);
			return this;
		}),
		$set: d(set)
	}));
	defineProperty(Observable.prototype, isObservableSymbol, d('', true));

	return Observable;
});
