var	glob = require('glob'),
	iswin = require('iswin'),
	Q = require('q'),
	async = require('async');

function fix_pathes(files){
	return files.map(function(f){
		var p = f.replace(/\//g, '\\');
		return p.indexOf(' ') >= 0 ? '"' + p + '"' : p;
	});
}

function glob_task(pattern){
	return function(callback){
		return glob(pattern, {}, callback);
	};
}

function resolve(patterns){
	if (!patterns) return [];

	// static files
	var files = patterns.filter(function(p){
		return p.indexOf('*') < 0;
	});

	var tasks = patterns
		.filter(function(p){ return p.indexOf('*') >= 0; })
		.map(function(p){ return glob_task(p); });

	var defer = Q.defer();

	async.parallel(tasks, function(err, results){
		if (err) {
			defer.reject(err);
		} else {
			var matches = _.flatten(results);
			files = matches.concat(files);
			files = iswin() ? fix_pathes(files) : files;
			defer.resolve(files);
		}
	});

	return defer.promise;
}

function exclude(all, items){
	if (items.length == 0) return all;

	items.forEach(function(it){
		var i = all.indexOf(it);
		if (i >= 0){
			all.splice(i, 1);
		}
	});

	return all;
}

module.exports = function(patterns){
	patterns = typeof patterns == 'string' ? [patterns] : patterns || [];
	patterns = patterns.filter(_.identity);

	var includes = patterns
		.filter(function(p){ return p.charAt(0) != '!'; });
	var excludes = patterns
		.filter(function(p){ return p.charAt(0) == '!'; })
		.map(function(s){ return s.substr(1); });

	return Q.all([resolve(includes), resolve(excludes)])
		.then(function(results){
			return exclude(results[0], results[1]);
		});
};
