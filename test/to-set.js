'use strict';

var toArray = require('es5-ext/array/to-array')
  , isSet   = require('observable-set/is-observable-set');

module.exports = exports = function (t, a) {
	exports.tests(t(require('../create')(require('es6-map'))
		.prototype).constructor, a);
};

exports.tests = function (ObservableMap, a) {
	var map, set, x = {}, y, z, adds = 0, deletes = 0, clears = 0, others = 0
	  , listener;

	x = ['raz', 'one'];
	y = ['dwa', 'two'];
	z = ['trzy', 'three'];
	map = new ObservableMap([x, y, z]);

	a.h1("Values");
	set = map.toSet();
	set.on('change', listener = function (event) {
		if (event.type === 'add') ++adds;
		else if (event.type === 'delete') ++deletes;
		else if (event.type === 'clear') ++clears;
		else ++others;
	});
	a(isSet(set), true, "Instance of Set");

	a.deep(toArray(set), ['one', 'two', 'three']);
	a(set, map.toSet(), "Memoize");

	a.h2("Set");
	map.set('cztery', 'four');
	a.deep(toArray(set), ['one', 'two', 'three', 'four']);
	a.deep([adds, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Overlap");
	map.set('trzy', 'two');
	a.deep(toArray(set), ['one', 'two', 'four']);
	a.deep([adds, deletes, clears, others], [1, 1, 0, 0], "Event");

	a.h2("Delete duplicated");
	map.delete('trzy');
	a.deep(toArray(set), ['one', 'two', 'four']);
	a.deep([adds, deletes, clears, others], [1, 1, 0, 0], "Event");

	a.h2("Delete");
	map.delete('dwa');
	a.deep(toArray(set), ['one', 'four']);
	a.deep([adds, deletes, clears, others], [1, 2, 0, 0], "Event");

	a.h2("Clear");
	map.clear();
	a.deep(toArray(set), []);
	a.deep([adds, deletes, clears, others], [1, 2, 1, 0], "Event");

	a.h2("Clear on empty");
	map.clear();
	a.deep(toArray(set), []);
	a.deep([adds, deletes, clears, others], [1, 2, 1, 0], "Event");

	set.off('change', listener);

	a.h1("Keys");
	map = new ObservableMap([x, y, z]);
	set = map.toSet('key');
	set.on('change', listener);
	adds = 0;
	deletes = 0;
	clears = 0;
	others = 0;
	a(isSet(set), true, "Instance of Set");

	a.deep(toArray(set), ['raz', 'dwa', 'trzy']);
	a(set, map.toSet('key'), "Memoize");

	a.h2("Set");
	map.set('cztery', 'four');
	a.deep(toArray(set), ['raz', 'dwa', 'trzy', 'cztery']);
	a.deep([adds, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Overrite");
	map.set('trzy', 'dwa');
	a.deep(toArray(set), ['raz', 'dwa', 'trzy', 'cztery']);
	a.deep([adds, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Delete");
	map.delete('trzy');
	a.deep(toArray(set), ['raz', 'dwa', 'cztery']);
	a.deep([adds, deletes, clears, others], [1, 1, 0, 0], "Event");

	a.h2("Clear");
	map.clear();
	a.deep(toArray(set), []);
	a.deep([adds, deletes, clears, others], [1, 1, 1, 0], "Event");

	a.h2("Clear on empty");
	map.clear();
	a.deep(toArray(set), []);
	a.deep([adds, deletes, clears, others], [1, 1, 1, 0], "Event");
};
