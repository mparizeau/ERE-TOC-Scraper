var fs = require('fs');
var getData = require('./data');
var format = require('./format');

function writeHTML(postData) {
  var html = format.getHTML(postData);
  fs.writeFileSync('results.html', html);
}

var commandLineArg = process.argv[2];

if (commandLineArg === '-f') {
  var postData = JSON.parse(fs.readFileSync('results.txt'));
  writeHTML(postData);
} else {
  getData(function(postData) {
    fs.writeFileSync('results.txt', JSON.stringify(postData));
    writeHTML(postData);
  });
}