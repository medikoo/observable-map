'use strict';

module.exports = require('./to-set')(require('./filter-map-subset')(
	require('./create')(require('es6-map/primitive'))
));
