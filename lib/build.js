var csc = require('./csc'),
	Q = require('q'),
	async = require('async'),
	path = require('path'),
	format = require('util').format,
	debug = require('debug')('csc'),
	_ = require('./util')._;

function log(){
	var msg = format.apply(null, _.toArray(arguments));
	console.log('csc: ' + msg);
}

function init_module(options, m){
	var mod = m;

	mod.nologo = true;

	// default out
	if (!mod.out){
		mod.out = mod.name + '.dll';
	}

	var out = options.out || {};
	// prefix and suffix
	if (out.prefix){
		mod.out = options.out.prefix + mod.out;
	}
	var suffix = out.suffix;
	if (suffix){
		var i = mod.out.lastIndexOf('.');
		if (i >= 0) {
			mod.out = mod.out.substring(0, i) + suffix + mod.out.substr(i);
		} else {
			// unusual, but acceptable
			mod.out += suffix;
		}
	}

	// prepend outdir
	if (out.dir){
		mod.out = path.join(out.dir, mod.out);
	}

	// default src
	if (!mod.src){
		mod.src = mod.name + '/**/*.cs'
	}
	if (typeof mod.src == 'string'){
		mod.src = [mod.src];
	}
	mod.src = options.src.concat(mod.src || []);

	// prepend src root if specified
	if (options.srcroot){
		var sep = _(options.srcroot).endsWith('/') ? '' : '/';
		mod.src = mod.src.map(function(p) {
			var negative = p.charAt(0) == '!';
			return (negative ? '!' : '')
				+ options.srcroot + sep
				+ (negative ? p.substr(1) : p);
		});
	}

	// update refs
	mod.refs = mod.refs || [];
	var refs = typeof mod.refs == 'string' ?
		mod.refs.split(',').filter(_.identity)
		: mod.refs.filter(_.identity);
	// replace build vars
	mod.refs = refs.map(function(r){
		return _(r).startsWith('$') ? options.vars[r.substr(1)] : r;
	});

	// warn level
	if (typeof options.warn !== 'undefined') {
		mod.warn = options.warn;
	}

	// deps
	mod.deps = typeof mod.deps === 'string' ?
		mod.deps.split(/[,;]/).map(_.trim).filter(_.identity)
		: (mod.deps || []).map(_.trim).filter(_.identity);

	return mod;
}

function create_unit(options, m){

	var mod = init_module(options, m);
	var defer = Q.defer();
	var units;
	var deps = []; // dep units

	function compile(){
		debug('compiling module ' + mod.name);

		// convert deps to refs
		var refs = deps.map(function(d){
			return d.module.out;
		});
		mod.refs = Array.isArray(mod.refs) ? mod.refs.concat(refs) : refs;

		compile_core();
	}

	function compile_core(){
		csc(mod, function(err, res){
			if (res){
				res.stdout && log(res.stdout);
				res.stderr && log(res.stderr);
			}
			if (err) {
				log(err);
				defer.reject(err);
			} else {
				debug('compiled module %s', mod.name);
				defer.resolve(mod);
			}
		});
	}

	function run(list){
		debug('running module %s', mod.name);

		units = list;

		// resolve dep units
		deps = mod.deps.map(function(name){
			var d = _.find(units, function(u){ return u.name == name; });
			if (!d){
				return { name: name };
			}
			return d;
		});

		var promises = deps.map(function(d){
			if (!d.promise) {
				return Q.reject('unable to resolve module ' + d.name);
			}
			return d.promise;
		});

		// wait deps then compile
		Q.all(promises)
			.then(compile)
			.fail(function(err){
				defer.reject(err);
			});
	}

	return {
		module: mod,
		name: mod.name,
		promise: defer.promise,
		run: run
	};
}

function taskFn(u, units){
	var unit = u;
	return function(callback){
		unit.promise.then(function(){
			callback(null, unit.name);
		});
		unit.promise.fail(function(err){
			callback(err, null);
		});
		unit.run(units);
	};
}

module.exports = function(options, modules){

	if (typeof modules == 'object'){
		// convert modules object to array
		modules = Object.keys(modules).map(function(name){
			var mod = modules[name];
			mod.name = name;
			return mod;
		});
	}

	if (typeof options.src == 'string') {
		options.src = [options.src];
	}
	options.src = options.src || [];

	var defer = Q.defer();

	// build module units
	var units = modules.map(function(m){
		return create_unit(options, m);
	});

	// create async tasks
	var tasks = units.map(function(u){
		return taskFn(u, units);
	});

	async.parallelLimit(tasks, 10, function(err, results){
		if (err) defer.reject(err);
		else defer.resolve(results);
	});

	return defer.promise;
};
