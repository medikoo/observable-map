'use strict';

var validFunction   = require('es5-ext/function/valid-function')
  , memoize         = require('memoizee/lib/regular')
  , validMap        = require('es6-map/valid-map')
  , filterMapSubset = require('./filter-map-subset')
  , toSet           = require('./to-set')
  , create          = require('./create');

module.exports = memoize(function (Map) {
	validFunction(Map);
	validMap(Map.prototype);
	Map = create(Map);
	toSet(filterMapSubset(Map.prototype));
	return Map;
});
