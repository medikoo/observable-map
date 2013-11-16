'use strict';

var isObservable = require('observable-value/is-observable')
  , isMap        = require('es6-map/is-map');

module.exports = function (value) {
	return (isMap(value) && isObservable(value));
};
