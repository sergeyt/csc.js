var csc = require('../../index');

csc({
	src: '*.cs',
	out: 'hello.exe',
	nologo: true
}, function(err, res){
	if (res){
		res.stdout && console.log(res.stdout);
		res.stderr && console.log(res.stderr);
	}
	if (err){
		console.error(err);
	}
});
