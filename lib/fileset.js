var	path = require('path'),
	globs = require('globs'),
	iswin = require('iswin');

function fix_pathes(files){
	if (iswin()){
		return files.map(function(f){
			return f.replace(/\//g, '\\');
		});
	}
	return files;
}

function is_pattern(p){
	return p && (p.charAt(0) == '!' || p.indexOf('*') >= 0);
}

function resolve_patterns(patterns){
	if (!patterns){
		return [];
	}
	if (typeof patterns == 'string'){
		patterns = [patterns];
	}
	var files = patterns.filter(function(p){
		return !is_pattern(p);
	});
	patterns = patterns.filter(is_pattern);
	files = fix_pathes(globs.sync(patterns).concat(files));
	// quick hack to remove duplicate AssemblyInfo.cs files
	// TODO fix globs
	var count = 0;
	return files.filter(function(file){
		var name = path.basename(file);
		if (name.toLowerCase() == "assemblyinfo.cs"){
			if (count > 0) return false;
			count++;
		}
		return true;
	});
}

module.exports = function(patterns){
	return {
		resolve: function(){
			return resolve_patterns(patterns);
		},
		toString: function(){
			return patterns;
		}
	};
};
