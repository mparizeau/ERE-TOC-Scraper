var request = require('request');
var async = require('async');
var format = require('./format');

function requestPage(pageIndex, callback) {
  request('http://earlyretirementextreme.com/page/' + pageIndex, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(null, format.parseHTML(body));
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

module.exports = function(callback) {
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
        console.log("finished " + (currentIndex  - 1));

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
        var diff = a.originallyPosted - b.originallyPosted;
        // sort by id if they were posted at the exact same time
        return (diff === 0) ? (a.id - b.id) : diff;
      });
      callback(finalPosts);
    }
  );
};