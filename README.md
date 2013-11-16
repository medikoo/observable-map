# observable-map

## Configure observable map collections

### Based on native ECMAScript6 Map

### Usage

```javascript
var ObservableMap = require('observable-map');

var map = new ObservableMap([['one', 1], ['two', 2]]);

map.on('change', function (event) {
  if (event.type === 'set') console.log("Set:", event.key, event.value);
  else if (event.type === 'delete') console.log("Deleted:", event.key);
  else if (event.type === 'clear') console.log("Map cleared");
});

map.set('three', 3); // Added: three, 3
map.delete('two');   // Deleted: two
map.delete('foo');   // (ignored)
map.clear();         // Map cleared
map.clear();         // (ignored)

// Observable filters:
map = ObservableMap([['one', 1], ['two', 2], ['three', 3], ['four', 4]]);
var filtered = map.filter(function (value) { return value % 2; }); // { one: 1, three: 3 }

filtered.on('change', function (event) {
  if (event.type === 'set') console.log("Set:", event.key, event.value);
  else if (event.type === 'delete') console.log("Deleted:", event.key);
  else if (event.type === 'clear') console.log("Map cleared");
});

map.set('five', 5);  // Set: five, 5
map.set('six', 6);   // (ignored)
map.delete('three'); // Deleted: three
map.delete('two');   // (ignored)
map.clear();         // Map cleared

// Observable maps:
map = ObservableMap([['one', 1], ['two', 2], ['three', 3], ['four', 4]]);
var mapped = map.map(function (num) { return num * 2; }); // { one: 2, two: 4, three: 6, four: 8 }

mapped.on('change', function (event) {
  if (event.type === 'set') console.log("Set:", event.key, event.value);
  else if (event.type === 'delete') console.log("Deleted:", event.key);
  else if (event.type === 'clear') console.log("Map cleared");
});

map.add('five', 5);  // Added: five, 10
map.delete('three'); // Deleted: three
map.clear();         // Map cleared

// Observable sets:
// Values
map = ObservableMap([['one', 1], ['two', 2], ['three', 3], ['four', 4]]);
var values = map.toSet(); // { 1, 2, 3, 4 }

values.on('change', function (event) {
  if (event.type === 'add') console.log("Add:", event.value);
  else if (event.type === 'delete') console.log("Deleted:", event.value);
  else if (event.type === 'clear') console.log("Set cleared");
});

map.add('five', 5);  // Added: 5
map.delete('three'); // Deleted: 3
map.clear();         // set cleared

// Keys
map = ObservableMap([['one', 1], ['two', 2], ['three', 3], ['four', 4]]);
var keys = map.toSet('key'); // { 'one', 'two', 'three', 'four' }
keys.on('change', function (event) {
  if (event.type === 'add') console.log("Add:", event.value);
  else if (event.type === 'delete') console.log("Deleted:", event.value);
  else if (event.type === 'clear') console.log("Set cleared");
});

map.add('five', 5);  // Added: five
map.delete('three'); // Deleted: three
map.clear();         // set cleared
```

### Installation
#### NPM

In your project path:

	$ npm install observable-map

##### Browser

You can easily bundle _observable-map_ for browser with [modules-webmake](https://github.com/medikoo/modules-webmake)

## Tests [![Build Status](https://travis-ci.org/medikoo/observable-map.png)](https://travis-ci.org/medikoo/observable-map)

	$ npm test
