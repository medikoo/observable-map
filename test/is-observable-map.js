'use strict';

var ee              = require('event-emitter')
  , ObservableValue = require('observable-value')
  , Map             = require('es6-map')
  , ObservableMap   = require('../create')(Map);

module.exports = function (t, a) {
	var x = {};
	a(t(), false, "Undefined");
	a(t(null), false, "Null");
	a(t('raz'), false, "String");
	a(t({}), false, "Object");
	a(t(new ObservableValue()), false, "Observable value");
	a(t(ee({})), false, "Event emitter");
	a(t([]), false, "Array");
	a(t(function () {}), false, "Function");
	a(t(ee(x)), false, "Emitter");
	a(t(new Map()), false, "Map");
	a(t(new ObservableMap()), true, "Observable Map");
};
