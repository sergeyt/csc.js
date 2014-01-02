var csc = require('../../index');

csc({
	src: '*.cs',
	out: 'test.dll',
	nologo: true
}, function(err, res){
	if (err) {
		console.error(err);
		return;
	}
	res.stdout && console.log(res.stdout);
	res.stderr && console.log(res.stderr);
});
