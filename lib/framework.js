var path = require('path'),
	os = require('os');

function baseDir(){
	if (os.platform() == 'win32'){
		var dir = path.join(process.env.SystemRoot || process.env.windir, 'Microsoft.NET');
		var isx64 = os.arch() == 'x64';
		return path.join(dir, isx64 ? 'Framework64' : 'Framework');
	}
	// TODO resolve mono dir
	throw new Error('not supported yet!');
}

function dir(framework){
	// TODO mono support
	var dir = baseDir();
	switch ((framework || '').toLowerCase()){
		case 'net-2.0':
		case '2.0':
		case 'v2.0':
			return path.join(dir, 'v2.0.50727');
		case 'net-3.5':
		case '3.5':
		case 'v3.5':
			return path.join(dir, 'v3.5');
		case 'net-4.0':
		case '4.0':
		case 'v4.0':
			return path.join(dir, 'v4.0.30319');
		default:
			return path.join(dir, 'v3.5');
	}
}

module.exports = {
	baseDir: baseDir,
	dir: dir
};
