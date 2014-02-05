var moment = require('moment');

var model = {};
var options = {};

exports.initialize = function(model_, options_) {
  model = model_;
  options = options_;
}

exports.posts = function(req, res) {
  var posts = model.posts.map(function(post) {
    var result = Object.create(post);
    result.publishedAt = moment(result.publishedAt).fromNow();
    return result;
  });
  res.render('posts', { posts: posts, headline: model.headline });
}


