var csc = require('../../index');

csc({
	src: '*.cs',
	out: 'hello.exe',
	nologo: true
}, function(err, res){
	if (err) {
		console.error(err);
		return;
	}
	res.stdout && console.log(res.stdout);
	res.stderr && console.log(res.stderr);
});
