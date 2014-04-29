'use strict';

var Map     = require('es6-map')
  , isMap   = require('es6-map/is-map')
  , toArray = require('es5-ext/array/to-array')

  , create = Object.create;

module.exports = function (t, a) {
	var ReadOnlyMap = t(Map), arr = [['raz', 'one'], ['dwa', 'two']]
	  , map = new ReadOnlyMap(arr), X;

	a(isMap(map), true, "Map");
	a(map instanceof ReadOnlyMap, true, "Subclass");
	a.deep(toArray(map), [['raz', 'one'], ['dwa', 'two']], "Content");

	a.throws(function () { map.set('elo', 'raz'); }, RangeError, "Add");
	a.throws(function () { map.delete('raz'); }, RangeError, "Delete");
	a.throws(function () { map.clear(); }, RangeError, "Clear");

	a.deep(toArray(map), [['raz', 'one'], ['dwa', 'two']], "Content unaltered");

	X = function () {};
	X.prototype = create(Map.prototype);
	X.prototype.constructor = X;

	X = t(X);
	a(X.prototype._set, Map.prototype.set, "Prototype: deep");
};
