var fs = require('fs');
var getData = require('./data');
var format = require('./format');

getData(function(postData) {
	fs.writeFileSync('results.txt', JSON.stringify(postData));

	var html = format.getHTML(postData);
	fs.writeFileSync('results.html', html);
});