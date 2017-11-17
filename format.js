var _ = require('underscore');
var cheerio = require('cheerio');
var moment = require('moment');

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var wikiTemplate = {
  monthTitle: _.template("'''{{month}}'''"),
  post: _.template("{{day}} - [{{link}}/ {{title}}]"),
  wordPost: _.template("{{count}} words - [{{link}}/ {{title}}]"),
};

function getPostHTML(postData) {
  return postData.map(function(post) {
    return cheerio('<a>')
      .attr('title', post.title)
      .attr('href', post.link)
      .text(post.title);
  });  
}

function getGroupedByMonth(postData) {
  return _.groupBy(postData, function(post) {
    return moment(post.originallyPosted).format('MMMM YYYY');
  });
}

module.exports = {
  parseHTML: function(body) {
    var $ = cheerio.load(body);
    var posts = [];
    $('.post-meta').each(function() {
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

      var content = $this.find('.post-content').children('p, table, li, blockquote');
      if (originallyPosted !== '') {
        content = content.slice(0, content.length - 1);
      }
      var matches = content.text().match(/\S+/g);
      var wordCount = matches ? matches.length : 0;

      var imageCount = $this.find('.post-content img').length;

      posts.push({
        title: titleLink.attr('title'),
        link: titleLink.attr('href'),
        originallyPosted: postDate,
        wordCount: wordCount,
        imageCount: imageCount,
        id: postId
      });
    });

    return posts;
  },

  getHTML: function(postData) {
    var groupedPosts = getGroupedByMonth(postData);

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
  },

  getWikiMarkup: function(postData) {
    var groupedPosts = getGroupedByMonth(postData.reverse());

    var finalText = '';
    for (var month in groupedPosts) {
      finalText += wikiTemplate.monthTitle({month: month}) + '\n\n';

      finalText += groupedPosts[month].reduce(function(previous, post) {
        return previous + wikiTemplate.post({
          day: moment(post.originallyPosted).format('Do'),
          link: post.link,
          title: post.title
        }) + '\n\n';
      }, '');
    }

    return finalText;
  },

  getWikiMarkupByLength: function(postData) {
    var sortedPosts = postData.sort(function(a, b) {
      return b.wordCount - a.wordCount;
    });

    return sortedPosts.reduce(function(previous, post) {
      return previous + wikiTemplate.wordPost({
        count: post.wordCount,
        link: post.link,
        title: post.title
      }) + '\n\n';
    }, '');
  },

  getWikiMarkupByEffectiveLength: function(postData) {
    var effectiveCount = function(post) {
      return post.imageCount * 1000 + post.wordCount;
    }

    var sortedPosts = postData.sort(function(a, b) {
      return effectiveCount(b) - effectiveCount(a);
    });

    return sortedPosts.reduce(function(previous, post) {
      return previous + wikiTemplate.wordPost({
        count: effectiveCount(post),
        link: post.link,
        title: post.title
      }) + '\n\n';
    }, '');
  }
};