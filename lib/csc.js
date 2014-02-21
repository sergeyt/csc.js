var exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	fx = require('./framework'),
	fileset = require('./fileset.async');
	_ = require('./util')._;

function build_args(options){

	// copy options to avoid side effects
	options = _.extend({}, options);

	// shortcuts
	if (options.target == 'lib'){
		options.target = 'library';
	}

	// auto target based on output file
	if (!options.target && options.out){
		var out = options.out.toLowerCase();
		if (_(out).endsWith('.dll')){
			options.target = 'library';
		} else if (_(out).endsWith('.exe')){
			options.target = 'exe';
		}
	}

	// schema of basic options
	var schema = [
		{key: 'platform', opt:'platform', type: 'string'},
		{key: 'target', opt:'t', type: 'string'},
		{key: 'out', opt:'out', type: 'string'},
		{key: 'nologo', opt:'nologo', type: 'flag'},
		{key: 'nostdlib', opt:'nostdlib', type: 'flag'},
		{key: 'noconfig', opt:'noconfig', type: 'flag'},
		{key: 'optimize', opt:'o', type: 'plus'},
		{key: 'checked', opt:'checked', type: 'plus'},
		{key: 'unsafe', opt:'unsafe', type: 'flag'},
		{key: 'keycontainer', opt:'keycontainer', type: 'string'},
		{key: 'keyfile', opt:'keyfile', type: 'file'},
		{key: 'define', opt:'define', type: 'string'},
		{key: 'main', opt:'main', type: 'string'},
		{key: 'warn', opt:'warn', type: 'string'}
	];

	var argv = schema.filter(function(p){
		if (!options.hasOwnProperty(p.key)){
			return false;
		}
		if (p.type == 'flag'){
			return !!options[p.key];
		}
		return true;
	}).map(function(p){
		if (p.type == 'flag'){
			return '/' + p.opt;
		}
		var v = options[p.key];
		if (p.type == 'plus'){
			return '/' + p.opt + (!!v ? '+' : '-');
		}
		return '/' + p.opt + ':' + v;
	});

	// debug
	if (options.debug === true){
		args.push('/debug+');
	} else if (options.debug === false){
		args.push('/debug-');
	} else if (options.debug === 'pdbonly' || options.debug == 'full'){
		args.push('/debug:' + options.debug);
	}

	// TODO glob patterns for references?
	// refs
	var refs = (options.refs || [])
		.filter(function(r){
			if (!r) return false;
			return typeof r === 'string' ? true : r.alias && r.file;
		})
		.map(function(r){
			if (typeof r === 'string'){
				return '/r:' + r;
			}
			return '/r:' + r.alias + '=' + r.file;
		});
	argv = argv.concat(refs);

	// TODO use async.parallel for resources and input files
	// resources
	return map_resources(options.resources).then(function(resources){
		argv = argv.concat(resources);
		// append source files
		return fileset(options.src).then(function(files){
			return argv.concat(files);
		});
	});
}

function map_resources(input){
	// filter invalid resources
	input = (input || []).filter(function(r){
		if (!r) return false;
		return typeof r === 'string' ? true : r.id && r.file;
	});
	// possible file patterns
	var patterns = input.filter(function(r){
		return typeof r === 'string';
	});
	// objective resources
	var objects =  input.filter(function(r){
		return typeof r !== 'string';
	}).map(function(r){
		var s = '/res:' + r.file + ',' + r.id;
		return !!r.private ? s + ',private' : s;
	});
	return fileset(patterns).then(function(files){
		return files
			.map(function(f){ return '/res:' + f; })
			.concat(objects);
	});
}

module.exports = function(options, callback){

	build_args(options)
		.then(function(args){
			// ensure outdir
			var out = path.resolve(options.out);
			var outdir = path.dirname(out);
			if (!fs.existsSync(outdir)) {
				fs.mkdirSync(outdir);
			}
			var outfile = path.basename(out);

			// TODO: mono support
			// generate rsp file since cmd line could be long
			var rspfile = outfile + '.rsp';
			var rspcontent = args.join('\n');
			fs.writeFileSync(rspfile, rspcontent);

			var dir = fx.dir(options.framework);
			var cmd = path.join(dir, 'csc.exe') + ' @' + rspfile;

			exec(cmd, {encoding: 'utf8'}, function(err, stdout, stderr){
				if (typeof options['keep-rsp'] === 'undefined')
					fs.unlinkSync(rspfile);

				// TODO parse errors
				callback(err, {stdout:stdout, stderr:stderr});
			});
		})
		.fail(function(err){
			callback(err, null);
		});
};
