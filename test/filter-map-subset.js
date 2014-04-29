'use strict';

var toArray       = require('es5-ext/array/to-array')
  , ObservableSet = require('observable-set');

module.exports = exports = function (t, a) {
	exports.tests(t(require('../create')(require('es6-map'))
		.prototype).constructor, a);
};

exports.tests = function (ObservableMap, a) {
	var map, x = {}, y, z, w, u, map2, fn, arr, set
	  , sets = 0, deletes = 0, clears = 0, others = 0, listener;

	// Filter
	a.h1("Filter");
	x = ['raz', { val: 12 }];
	y = ['dwa', { val: 43 }];
	z = ['trzy', { val: 54 }];
	map = new ObservableMap([x, y, z]);

	map2 = map.filter(fn = function (val) { return val.val % 2; });
	a.deep(toArray(map2), [y]);
	a(map2, map.filter(fn), "Memoize");
	map2.on('change', listener = function (event) {
		if (event.type === 'set') ++sets;
		else if (event.type === 'delete') ++deletes;
		else if (event.type === 'clear') ++clears;
		else ++others;
	});

	a.h2("Set matching");
	w = ['four', { val: 33 }];
	map.set(w[0], w[1]);
	a.deep(toArray(map2), [y, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Set not matching");
	u = { val: 30 };
	map.set('five', u);
	a.deep(toArray(map2), [y, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Inner");
	y[1].val = 44;
	a.deep(toArray(map2), [y, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Refresh");
	map2.refresh(y[0], y[1]);
	a.deep(toArray(map2), [w]);
	a.deep([sets, deletes, clears, others], [1, 1, 0, 0], "Event");

	a.h2("Update");
	y[1] = { val: 43 };
	map.set(y[0], y[1]);
	a.deep(toArray(map2), [w, y]);
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Event");

	a.h2("Delete not matching");
	map.delete(x[0]);
	a.deep(toArray(map2), [w, y]);
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Event");

	a.h2("Delete matching");
	map.delete(y[0]);
	a.deep(toArray(map2), [w]);
	a.deep([sets, deletes, clears, others], [2, 2, 0, 0], "Event");

	a.h2("Clear");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [2, 2, 1, 0], "Event");

	a.h2("Clear on empty");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [2, 2, 1, 0], "Event");

	map2.off('change', listener);

	// Map
	a.h1("Map");
	x = ['raz', { val: 12 }];
	y = ['dwa', { val: 43 }];
	z = ['trzy', { val: 54 }];
	map = new ObservableMap([x, y, z]);
	sets = 0;
	deletes = 0;
	clears = 0;
	others = 0;

	map2 = map.map(fn = function (val) { return val.val * 2; });
	a.deep(toArray(map2), [['raz', 24], ['dwa', 86], ['trzy', 108]]);
	a(map2, map.map(fn), "Memoize");
	map2.on('change', listener);

	a.h2("Set");
	w = ['cztery', { val: 33 }];
	map.set(w[0], w[1]);
	a.deep(toArray(map2), [['raz', 24], ['dwa', 86], ['trzy', 108],
		['cztery', 66]]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Inner");
	y[1].val = 44;
	a.deep(toArray(map2), [['raz', 24], ['dwa', 86], ['trzy', 108],
		['cztery', 66]]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h2("Refresh");
	map2.refresh(y[0], y[1]);
	a.deep(toArray(map2), [['raz', 24], ['dwa', 88], ['trzy', 108],
		['cztery', 66]]);
	a.deep([sets, deletes, clears, others], [2, 0, 0, 0], "Event");

	a.h2("Delete");
	map.delete(x[0]);
	a.deep(toArray(map2), [['dwa', 88], ['trzy', 108], ['cztery', 66]]);
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Event");

	a.h2("Clear");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [2, 1, 1, 0], "Event");

	a.h2("Clear on empty");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [2, 1, 1, 0], "Event");

	map2.off('change', listener);

	// Subset
	a.h1("Subset");
	x = ['raz', 'one'];
	y = ['dwa', 'two'];
	z = ['trzy', 'three'];
	map = new ObservableMap([x, y, z]);
	sets = 0;
	deletes = 0;
	clears = 0;
	others = 0;

	a.h2("Static");
	map2 = map.subset(arr = ['raz', 'trzy', 'cztery']);
	map2.on('change', listener = function (event) {
		if (event.type === 'set') ++sets;
		else if (event.type === 'delete') ++deletes;
		else if (event.type === 'clear') ++clears;
		else ++others;
	});
	a.deep(toArray(map2), [x, z]);
	a(map2, map.subset(arr), "Memoize");

	a.h3("Set matching");
	w = ['cztery', 'four'];
	map.set(w[0], w[1]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h3("Set not matching");
	u = ['pięć', 'five'];
	map.set(u[0], u[1]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h3("Update");
	x[1] = 1;
	map.set(x[0], x[1]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [2, 0, 0, 0], "Event");

	a.h3("Delete not matching");
	map.delete(y[0]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [2, 0, 0, 0], "Event");

	a.h3("Delete matching");
	map.delete(z[0]);
	a.deep(toArray(map2), [x, w]);
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Event");

	a.h3("Clear");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [2, 1, 1, 0], "Event");

	a.h3("Clear on empty");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [2, 1, 1, 0], "Event");

	map2.off('change', listener);

	a.h2("Dynamic");
	x = ['raz', 'one'];
	y = ['dwa', 'two'];
	z = ['trzy', 'three'];
	map = new ObservableMap([x, y, z]);
	sets = 0;
	deletes = 0;
	clears = 0;
	others = 0;
	set = new ObservableSet(['raz', 'trzy', 'cztery']);
	map2 = map.subset(set);
	a.deep(toArray(map2), [x, z]);
	a(map2, map.subset(set), "Memoize");
	map2.on('change', listener = function (event) {
		if (event.type === 'set') ++sets;
		else if (event.type === 'delete') ++deletes;
		else if (event.type === 'clear') ++clears;
		else ++others;
	});

	a.h3("Set matching");
	w = ['cztery', 'four'];
	map.set(w[0], w[1]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h3("Set not matching");
	u = ['pięć', 'five'];
	map.set(u[0], u[1]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [1, 0, 0, 0], "Event");

	a.h3("Update");
	x[1] = 1;
	map.set(x[0], x[1]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [2, 0, 0, 0], "Event");

	a.h3("Delete not matching");
	map.delete(y[0]);
	a.deep(toArray(map2), [x, z, w]);
	a.deep([sets, deletes, clears, others], [2, 0, 0, 0], "Event");

	a.h3("Delete matching");
	map.delete(z[0]);
	a.deep(toArray(map2), [x, w]);
	a.deep([sets, deletes, clears, others], [2, 1, 0, 0], "Event");

	a.h3("Add to set");
	set.add('pięć');
	a.deep(toArray(map2), [x, w, u]);
	a.deep([sets, deletes, clears, others], [3, 1, 0, 0], "Event");

	a.h3("Remove from set");
	set.delete('raz');
	a.deep(toArray(map2), [w, u]);
	a.deep([sets, deletes, clears, others], [3, 2, 0, 0], "Event");

	a.h3("Clear");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [3, 2, 1, 0], "Event");

	a.h3("Clear on empty");
	map.clear();
	a.deep(toArray(map2), []);
	a.deep([sets, deletes, clears, others], [3, 2, 1, 0], "Event");

	map2.off('change', listener);
};
