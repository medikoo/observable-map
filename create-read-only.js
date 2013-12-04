'use strict';

var validFunction = require('es5-ext/function/valid-function')
  , d             = require('d/d')
  , memoize       = require('memoizee/lib/regular')
  , validMap      = require('es6-map/valid-map')

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
		if (!(this instanceof ReadOnly)) {
			return new ReadOnly(arguments[0], arguments[1]);
		}
		Constructor.apply(this, arguments);
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
});
