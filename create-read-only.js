'use strict';

var validFunction  = require('es5-ext/function/valid-function')
  , mixin          = require('es5-ext/object/mixin-prototypes')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , d              = require('d')
  , memoize        = require('memoizee/plain')
  , validMap       = require('es6-map/valid-map')

  , create = Object.create, defineProperties = Object.defineProperties
  , getDescriptor = Object.getOwnPropertyDescriptor
  , getPrototypeOf = Object.getPrototypeOf
  , readOnlyThrow;

readOnlyThrow = d(function () { throw new RangeError("Set is read-only"); });

module.exports = memoize(function (Constructor) {
	var ReadOnly, descs;

	validFunction(Constructor);
	validMap(Constructor.prototype);

	ReadOnly = function (/* iterable, comparator */) {
		var map;
		if (!(this instanceof ReadOnly)) throw new TypeError('Constructor requires \'new\'');
		map = new Constructor(arguments[0], arguments[1]);
		if (setPrototypeOf) setPrototypeOf(map, getPrototypeOf(this));
		else mixin(map, getPrototypeOf(this));
		return map;
	};

	ReadOnly.prototype = create(Constructor.prototype, {
		constructor: d(ReadOnly)
	});

	descs = {};
	['clear', 'delete', 'set'].forEach(function (name) {
		var proto = Constructor.prototype;
		descs[name] = readOnlyThrow;
		while (proto && !proto.hasOwnProperty(name)) proto = getPrototypeOf(proto);
		if (!proto) {
			throw new TypeError(Constructor + " is not valid Set constructor");
		}
		descs['_' + name] = getDescriptor(proto, name);
	});
	defineProperties(ReadOnly.prototype, descs);

	return ReadOnly;
}, { normalizer: require('memoizee/normalizers/get-1')() });
