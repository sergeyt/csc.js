var csc = require('../../index');

csc({
	target: 'exe',
	src: ['hello.cs'],
	out: 'hello.exe'
});
