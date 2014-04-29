'use strict';

var remove  = require('es5-ext/array/#/remove')
  , Map     = require('es6-map')
  , isMap   = require('es6-map/is-map')
  , toArray = require('es5-ext/array/to-array');

module.exports = function (t, a) {
	var ObservableMap = t(Map)
	  , arr = [['raz', 'one'], ['dwa', 'two'], ['trzy', 'three']]
	  , map = new ObservableMap(arr)
	  , sets = 0, deletes = 0, clears = 0, others = 0;

	a(isMap(map), true, "Is map");
	a(map instanceof ObservableMap, true, "Subclassed");

	a.deep(toArray(map), arr, "Constructor");

	map.on('change', function (event) {
		if (event.type === 'set') ++sets;
		else if (event.type === 'delete') ++deletes;
		else if (event.type === 'clear') ++clears;
		else ++others;
	});

	map.delete('dwa');
	remove.call(arr, arr[1]);

	a.deep(toArray(map), arr, "Delete: value");
	a.deep([sets, deletes, clears, others], [0, 1, 0, 0], "Delete: event");

	map.delete('elo');
	a.deep(toArray(map), arr, "Delete non existing: value");
	a.deep([sets, deletes, clears, others], [0, 1, 0, 0],
		"Delete non existing: event");

	map.set('cztery', 'elo');
	arr.push(['cztery', 'elo']);
	a.deep(toArray(map), arr, "Set: value");
	a.deep([sets, deletes, clears, others], [1, 1, 0, 0], "Set: event");

	map.set('cztery', 'four');
	arr[2][1] = 'four';
	a.deep(toArray(map), arr, "Update: value");
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Update: event");

	map.set('cztery', 'four');
	a.deep(toArray(map), arr, "Update same: value");
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Update same: event");

	map.clear();
	a.deep(toArray(map.values()), [], "Clear: value");
	a.deep([sets, deletes, clears, others], [2, 1, 1, 0], "Clear: event");

	map.clear();
	a.deep(toArray(map.values()), [], "Clear on empty: value");
	a.deep([sets, deletes, clears, others], [2, 1, 1, 0],
		"Clear on empty: event");
};
