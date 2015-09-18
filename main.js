var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var async = require('async');

function parseHTML(body) {
	var $ = cheerio.load(body);
	var posts = [];
	$('.post-meta').each(function(i, element) {
		var $this = $(this);
		var titleLink = $this.find('h1 a');
		var originallyPosted = $this.find('#bte_opp small').text();
		var postDate;
		if (originallyPosted === '') {
			// if there isn't an originally posted date then the post hasn't been republished
			// and we should look at the published date
			var published = $this.find('.post-date').text();
			var publishedDateString = published.match(/Published on (.+)/)[1];
			postDate = moment(publishedDateString, 'MMMM Do YYYY').toDate();
		} else {
			var postDateString = originallyPosted.match(/Originally posted (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)[1];
			postDate = new Date(postDateString);
		}

		posts.push({
			title: titleLink.attr('title'),
			link: titleLink.attr('href'),
			originallyPosted: postDate
		});
	});

	return posts;
}

function requestPage(pageIndex, callback) {
	request('http://earlyretirementextreme.com/page/' + pageIndex, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			callback(null, parseHTML(body));
			console.log("Finished Page " + pageIndex);
		} else if (error) {
			// if there's an error e.g. socket hang up then retry
			console.log("retrying " + pageIndex);
			setTimeout(function() {
				requestPage(pageIndex, callback);
			}, 1000);
		} else {
			// assume other response code (404) means we reached a page that doesn't exist
			callback(response.statusCode);
		}
	});
}

function getRequestPageWrapper(pageIndex) {
	return function(callback) {
		requestPage(pageIndex, callback);
	}
}

var hasError = false;
var currentIndex = 1;
var parallelCount = 10;
var finalPosts = [];

async.until(
	function() { return hasError; },
	function(next) {
		var requests = [];
		for (var i = currentIndex; i < currentIndex + parallelCount; ++i) {
			requests.push(getRequestPageWrapper(i));
		}

		async.parallel(requests, function(err, results) {
			hasError = err;
			currentIndex += parallelCount;

			results.forEach(function(posts) {
				posts && posts.forEach(function(post) {
					finalPosts.push(post);
				});
			});
			next();
		});
	},
	function() {
		finalPosts.sort(function(a, b) {
			return a.originallyPosted - b.originallyPosted;
		});
		fs.writeFile('results.txt', JSON.stringify(finalPosts));
	}
);