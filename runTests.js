var Jasmine = require('jasmine');
var jasmine = new Jasmine();

jasmine.loadConfigFile("tests/config/jasmine.json");
jasmine.execute();
