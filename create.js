'use strict';

var validFunction      = require('es5-ext/function/valid-function')
  , assign             = require('es5-ext/object/assign')
  , eq                 = require('es5-ext/object/eq')
  , mixin              = require('es5-ext/object/mixin-prototypes')
  , setPrototypeOf     = require('es5-ext/object/set-prototype-of')
  , d                  = require('d')
  , lazy               = require('d/lazy')
  , ee                 = require('event-emitter')
  , memoize            = require('memoizee/plain')
  , validMap           = require('es6-map/valid-map')
  , isObservableSymbol = require('observable-value/symbol-is-observable')
  , createReadOnly     = require('./create-read-only')

  , defineProperty = Object.defineProperty, getPrototypeOf = Object.getPrototypeOf;

module.exports = memoize(function (Constructor) {
	var Observable, clear, del, set, ReadOnly;

	validFunction(Constructor);
	validMap(Constructor.prototype);

	ReadOnly = createReadOnly(Constructor);

	Observable = function (/* iterable, comparator */) {
		var comparator = arguments[1], map;
		if (!(this instanceof Observable)) throw new TypeError('Constructor requires \'new\'');
		map = new Constructor(arguments[0], arguments[1]);
		if (setPrototypeOf) setPrototypeOf(map, getPrototypeOf(this));
		else mixin(map, getPrototypeOf(this));
		if (!map.__comparator__) defineProperty(map, '__comparator__', d('', comparator));
		return map;
	};
	if (setPrototypeOf) setPrototypeOf(Observable, Constructor);

	clear = Constructor.prototype.clear;
	del = Constructor.prototype.delete;
	set = Constructor.prototype.set;

	Observable.prototype = ee(Object.create(Constructor.prototype, assign({
		constructor: d(Observable),
		clear: d(function () {
			var event;
			if (!this.size) return;
			if (this.__postponed__) {
				event = this.__postponedEvent__;
				if (!event) {
					event = this.__postponedEvent__ =
						{ deleted: new ReadOnly(this, this.__comparator__) };
				} else {
					this.forEach(function (value, key) {
						if (event.set && event.set.has(key)) {
							event.set._delete(key);
							return;
						}
						if (!event.deleted) {
							event.deleted = new ReadOnly(null, this.__comparator__);
						}
						event.deleted._set(key, value);
					}, this);
				}
			}
			clear.call(this);
			if (!this.__postponed__) this.emit('change', { type: 'clear' });
		}),
		$clear: d(clear),
		delete: d(function (key) {
			var has = this.has(key), value, event;
			if (has) value = this.get(key);
			else return false;
			del.call(this, key);
			if (this.__postponed__) {
				event = this.__postponedEvent__;
				if (!event) event = this.__postponedEvent__ = {};
				if (event.set && event.set.has(key)) {
					event.set._delete(key);
				} else {
					if (!event.deleted) {
						event.deleted = new ReadOnly(null, this.__comparator__);
					}
					event.deleted._set(key, value);
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
			if (this.__postponed__) {
				event = this.__postponedEvent__;
				if (!event) event = this.__postponedEvent__ = {};
				if (has) {
					if (event.set && event.set.has(key)) event.set._delete(key);
				}
				if (event.deleted && event.deleted.has(key) &&
						eq(event.deleted.get(key), value)) {
					event.deleted._delete(key);
					return this;
				}
				if (!event.set) event.set = new ReadOnly(null, this.__comparator__);
				event.set._set(key, value);
				if (!has) return this;
				if (!event.deleted) {
					event.deleted = new ReadOnly(null, this.__comparator__);
				}
				event.deleted._set(key, oldValue);
				return this;
			}
			event = { type: 'set', key: key, value: value };
			if (has) event.oldValue = oldValue;
			this.emit('change', event);
			return this;
		}),
		$set: d(set),
		_postponed_: d.gs(function () {
			return this.__postponed__;
		}, function (value) {
			var event, key, entry;
			this.__postponed__ = value;
			if (value) return;
			event = this.__postponedEvent__;
			if (!event) return;
			if (event.set && event.set.size) {
				if (event.deleted && event.deleted.size) {
					if ((event.set.size === 1) && (event.deleted.size === 1) &&
							eq(key = event.set.keys().next().value,
								event.deleted.keys().next().value)) {
						event.type = 'set';
						event.key = key;
						event.value = event.set.get(key);
						event.oldValue = event.deleted.get(key);
						delete event.set;
						delete event.deleted;
					} else {
						event.type = 'batch';
					}
				} else if (event.set.size === 1) {
					entry = event.set.entries().next();
					event.type = 'set';
					event.key = entry[0];
					event.value = entry[1];
					delete event.set;
					delete event.deleted;
				} else {
					event.type = 'batch';
					delete event.deleted;
				}
			} else if (event.deleted && event.deleted.size) {
				if (event.deleted.size === 1) {
					entry = event.deleted.entries().next();
					event.type = 'delete';
					event.key = entry[0];
					event.value = entry[1];
					delete event.set;
					delete event.deleted;
				} else {
					event.type = 'batch';
					delete event.set;
				}
			} else {
				event = null;
			}
			this.__postponedEvent__ = null;
			if (!event) return;
			this.emit('change', event);
		})
	}, lazy({
		__postponed__: d('w', 0),
		__postponedEvent__: d('w', null)
	}))));
	defineProperty(Observable.prototype, isObservableSymbol, d('', true));

	return Observable;
}, { normalizer: require('memoizee/normalizers/get-1')() });
