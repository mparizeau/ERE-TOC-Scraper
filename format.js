var _ = require('underscore');
var cheerio = require('cheerio');
var moment = require('moment');

function getPostHTML(postData) {
	return postData.map(function(post) {
		return cheerio('<a>')
			.attr('title', post.title)
			.attr('href', post.link)
			.text(post.title);
	});	
}

module.exports = function(postData) {
	var groupedPosts = _.groupBy(postData, function(post) {
		return moment(post.originallyPosted).format('MMMM YYYY');
	});

	var finalHTML = cheerio('<html>');
	var bodyHTML = cheerio('<body>');
	finalHTML.append(bodyHTML);

	for (var month in groupedPosts) {
		var monthContainer = cheerio('<p>');
		monthContainer.append(cheerio('<strong>').text(month)).append('<br>');

		var postHTML = getPostHTML(groupedPosts[month]);
		postHTML.forEach(function(post) {
			monthContainer.append(post).append('<br>');
		});

		bodyHTML.append(monthContainer);
	}

	return cheerio.html(finalHTML);
}