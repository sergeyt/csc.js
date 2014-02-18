var csc = require('./csc'),
	Q = require('q'),
	async = require('async'),
	path = require('path'),
	format = require('util').format,
	_ = require('./util')._;

function log(){
	var msg = format.apply(null, _.toArray(arguments));
	console.log('csc: ' + msg);
}

function create_unit(options, m){

	var mod = m;
	var defer = Q.defer();
	var units;
	var deps = []; // dep units

	mod.nologo = true;

	// default out
	if (!mod.out){
		mod.out = mod.name + '.dll';
	}

	// prefix and suffix
	if (options.outprefix){
		mod.out = options.outprefix + mod.out;
	}
	var suffix = options.outsuffix;
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
	if (options.outdir){
		mod.out = path.join(options.outdir, mod.out);
	}

	// default src
	if (!mod.src){
		mod.src = './' + mod.name + '/**/*.cs'
	}

	// prepend src root if specified
	if (options.srcroot){
		var sep = _(options.srcroot).endsWith('/') ? '' : '/';
		if (Array.isArray(mod.src)) {
			mod.src = mod.src.map(function(pattern) {
				return options.srcroot + sep + pattern;
			});
		} else {
			mod.src = options.srcroot + sep + mod.src;
		}
	}

	// update refs
	if (mod.refs) {
		var refs = typeof mod.refs == 'string' ?
			mod.refs.split(',').filter(_.identity)
			: mod.refs;
		// replace build vars
		mod.refs = refs.map(function(r){
			return _(r).startsWith('$') ? options.vars[r.substr(1)] : r;
		});
	}

	// TODO prepend basedir to src

	// convert module.deps to array
	function depsArray(){
		if (typeof mod.deps === 'string'){
			return mod.deps.split(/[,;]/).map(_.trim).filter(_.identity);
		}
		return (mod.deps || []).map(_.trim).filter(_.identity);
	}

	function compile(){
		log('compiling module %s', mod.name);

		// convert deps to refs
		var refs = deps.map(function(d){
			return d.module.out;
		});
		mod.refs = Array.isArray(mod.refs) ? mod.refs.concat(refs) : refs;

		csc(mod, function(err, res){
			if (res){
				res.stdout && log(res.stdout);
				res.stderr && log(res.stderr);
			}
			if (err) {
				log(err);
				defer.reject(err);
			} else {
				defer.resolve(mod);
			}
		});
	}

	function run(list){
		log('running module %s', mod.name);

		units = list;

		// resolve dep units
		deps = depsArray().map(function(name){
			var d = _.find(units, function(u){ return u.name == name; });
			if (!d){
				return { name: name };
			}
			return d;
		});

		var depPromises = deps.map(function(d){
			if (!d.promise) {
				return Q.reject('unable to resolve module ' + d.name);
			}
			return d.promise;
		});

		// wait deps then compile
		Q.all(depPromises)
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

	var defer = Q.defer();

	// build module units
	var units = modules.map(function(m){
		return create_unit(options, m);
	});

	// create async tasks
	var tasks = units.map(function(u){
		return taskFn(u, units);
	});

	async.parallel(tasks, function(err, results){
		if (err) defer.reject(err);
		else defer.resolve(results);
	});

	return defer.promise;
};
