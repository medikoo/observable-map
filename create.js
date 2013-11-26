'use strict';

var validFunction      = require('es5-ext/function/valid-function')
  , assign             = require('es5-ext/object/assign')
  , eq                 = require('es5-ext/object/eq')
  , setPrototypeOf     = require('es5-ext/object/set-prototype-of')
  , d                  = require('d/d')
  , lazy               = require('d/lazy')
  , ee                 = require('event-emitter')
  , memoize            = require('memoizee/lib/regular')
  , validMap           = require('es6-map/valid-map')
  , isObservableSymbol = require('observable-value/symbol-is-observable')

  , defineProperty = Object.defineProperty;

module.exports = memoize(function (Constructor) {
	var Observable, clear, del, set;

	validFunction(Constructor);
	validMap(Constructor.prototype);

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

	Observable.prototype = ee(Object.create(Constructor.prototype, assign({
		constructor: d(Observable),
		clear: d(function () {
			if (!this.size) return;
			clear.call(this);
			if (this.__hold__) this.__set__ = this.__deleted__ = null;
			this.emit('change', { type: 'clear' });
		}),
		$clear: d(clear),
		delete: d(function (key) {
			var has = this.has(key), value;
			if (has) value = this.get(key);
			else return false;
			del.call(this, key);
			if (this.__hold__) {
				if (this.__set__ && this.__set__.has(key)) {
					this.__set__.delete(key);
				} else {
					if (!this.__deleted__) this.__deleted__ = new Constructor();
					this.__deleted__.set(key, value);
				}
				return true;
			}
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
			if (this.__hold__) {
				if (has) {
					if (this.__set__ && this.__set__.has(key)) this.__set__.delete(key);
				}
				if (this.__deleted__ && this.__deleted__.has(key) &&
						eq(this.__deleted__.get(key), value)) {
					this.__deleted__.delete(key);
				} else {
					if (!this.__set__) this.__set__ = new Constructor();
					this.__set__.set(key, value);
					if (has) {
						if (!this.__deleted__) this.__deleted__ = new Constructor();
						this.__deleted__.set(key, oldValue);
					}
				}
				return this;
			}
			event = { type: 'set', key: key, value: value };
			if (has) event.oldValue = oldValue;
			this.emit('change', event);
			return this;
		}),
		$set: d(set),
		_hold_: d.gs(function () { return this.__hold__; }, function (hold) {
			var event, set, deleted, key, value;
			this.__hold__ = value;
			if (value) return;
			set = this.__set__;
			deleted = this.__deleted__;
			if (set && set.size) {
				if (deleted && deleted.size) {
					if ((set.size === 1) && (deleted.size === 1) &&
							eq(key = set.keys().next().value, deleted.keys().next().value)) {
						event = { type: 'set', key: key, value: set.get(key),
							oldValue: deleted.get(key) };
					} else {
						event = { type: 'batch', set: set, deleted: deleted };
					}
				} else if (set.size === 1) {
					set.forEach(function (v, k) {
						key = k;
						value = v;
					});
					event = { type: 'set', key: key, value: value };
				} else {
					event = { type: 'batch', set: set };
				}
			} else if (deleted && deleted.size) {
				if (deleted.size === 1) {
					deleted.forEach(function (v, k) {
						key = k;
						value = v;
					});
					event = { type: 'delete', key: key, value: value };
				} else {
					event = { type: 'batch', deleted: deleted };
				}
			}
			this.__set__ = this.__deleted__ = null;
			if (!event) return;
			this.emit('change', event);
		})
	}, lazy({
		__hold__: d('w', 0),
		__set__: d('w', null),
		__deleted__: d('w', null)
	}))));
	defineProperty(Observable.prototype, isObservableSymbol, d('', true));

	return Observable;
});
