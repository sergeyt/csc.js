var exec = require('child_process').exec,
	path = require('path'),
	fx = require('./framework'),
	_ = require('./util')._;

function build_args(options) {
	return [
		options.src,
		options.out
	].filter(_.identity);
}

function default_callback(err, res){
	if (err) {
		console.error(err);
	} else {
		res.stderr && console.log(res.stderr);
		res.stdout && console.log(res.stdout);
	}
}

module.exports = function(options, callback){

	if (typeof callback != 'function'){
		callback = default_callback;
	}

	var dir = fx.dir(options.framework);
	var args = build_args(options);
	var cmd = path.join(dir, 'resgen.exe') + ' ' + args.join(' ');

	exec(cmd, {}, function(error, stdout, stderr){
		// TODO parse errors
		callback(error, {stdout:stdout, stderr:stderr});
	});
};
