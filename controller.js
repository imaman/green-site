var moment = require('moment');

var model = {};

exports.withModel = function(model_) {
  model = model_;
  return exports;
}

exports.posts = function(req, res) {
  var posts = model.posts.map(function(post) {
    var result = Object.create(post);
    result.publishedAt = moment(result.publishedAt).fromNow();
    return result;
  });
  res.render('posts', { posts: posts, headline: model.headline });
}


