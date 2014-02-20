// TODO make as separate npm package
// TODO implement both async and sync versions
var	glob = require('glob'),
	iswin = require('iswin');

function fix_pathes(files){
	return files.map(function(f){
		var p = f.replace(/\//g, '\\');
		return p.indexOf(' ') >= 0 ? '"' + p + '"' : p;
	});
}

function resolve(patterns){
	if (!patterns) return [];

	// static files
	var files = patterns.filter(function(p){
		return p.indexOf('*') < 0;
	});

	patterns = patterns.filter(function(p){ return p.indexOf('*') >= 0; });

	var matches = _.flatten(patterns.map(function(p){
		return glob(p, {mark: true, sync: true});
	}));

	files = matches.concat(files);
	return iswin() ? fix_pathes(files) : files;
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
	if (!patterns){
		return [];
	}
	if (typeof patterns == 'string'){
		patterns = [patterns];
	}
	patterns = patterns.filter(_.identity);

	var excludes = patterns.filter(function(p){ return p.charAt(0) == '!'; });
	var includes = patterns.filter(function(p){ return p.charAt(0) != '!'; });

	var all_files = resolve(includes);
	var excluded_files = resolve(excludes.map(function(s){ return s.substr(1); }));
	return exclude(all_files, excluded_files);
};
