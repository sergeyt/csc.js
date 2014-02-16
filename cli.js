var fs = require('fs'),
	path = require('path'),
	yaml = require('js-yaml'),
	build = require('./lib/build');

// load build.yml and modules.yml
var dir = process.cwd();
var options = yaml.safeLoad(fs.readFileSync(path.join(dir, 'build.yml'), 'utf8'));
var modules = yaml.safeLoad(fs.readFileSync(path.join(dir, 'modules.yml'), 'utf8'));

build(options, modules);
