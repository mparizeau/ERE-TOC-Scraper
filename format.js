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

module.exports = {
	parseHTML: function(body) {
		var $ = cheerio.load(body);
		var posts = [];
		$('.post-meta').each(function(i, element) {
			var $this = $(this);
			// id is of the form post-XXXX
			var postId = $this.attr('id').split('-')[1];
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
				originallyPosted: postDate,
				id: postId
			});
		});

		return posts;
	},

	getHTML: function(postData) {
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
};