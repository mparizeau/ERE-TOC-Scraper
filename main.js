var fs = require('fs');
var getData = require('./data');
var format = require('./format');
var argv = require('yargs').argv;

function writeHTML(postData) {
  var html = format.getHTML(postData);
  fs.writeFileSync('results.html', html);
}

var postData;
if (argv.f) {
  postData = JSON.parse(fs.readFileSync('results.txt'));
}

switch(argv.f) {
  case 'html':
    writeHTML(postData);
    break;
  case 'wiki':
    var wikiText = format.getWikiMarkup(postData);
    fs.writeFileSync('wiki-results.txt', wikiText);
    var wikiTextByCount = format.getWikiMarkupByLength(postData);
    fs.writeFileSync('wiki-bycount.txt', wikiTextByCount);
    var wikiTextByEffectiveCount = format.getWikiMarkupByEffectiveLength(postData);
    fs.writeFileSync('wiki-by-effectivecount.txt', wikiTextByEffectiveCount);
    break;
  default:
    getData(function(postData) {
      fs.writeFileSync('results.txt', JSON.stringify(postData));
      writeHTML(postData);
    });
}