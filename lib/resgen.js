var exec = require('child_process').exec,
	path = require('path'),
	fx = require('./framework'),
	_ = require('./util');

function build_args(options) {
	return [
		options.src,
		options.out
	].filter(_.identity);
}

module.exports = function(options, callback){

	var dir = fx.dir(options.framework);
	var args = build_args(options);
	var cmd = path.join(dir, 'resgen.exe') + ' ' + args.join(' ');

	exec(cmd, {}, function(error, stdout, stderr){
		// TODO parse errors
		callback(error, {stdout:stdout, stderr:stderr});
	});
};
