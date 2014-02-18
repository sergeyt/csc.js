var _ = require('underscore'),
	glob = require('glob'),
	iswin = require('iswin');

function fix_pathes(files){
	if (iswin()){
		return files.map(function(f){
			return f.replace(/\//g, '\\');
		});
	}
	return files;
}

function resolve_patterns(patterns){
	if (!patterns){
		return [];
	}
	if (Array.isArray(patterns)){
		return fix_pathes(_.flatten(patterns.map(function(p){
			return glob.sync(p);
		})));
	}
	return fix_pathes(glob.sync(patterns));
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
