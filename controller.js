var moment = require('moment');

exports.withModel = function(model) {
  var controller = exports;
  controller.posts = function(req, res) {
    var posts = model.posts.map(function(post) {
      var result = Object.create(post);
      result.publishedAt = moment(result.publishedAt).fromNow();
      return result;
    });
    res.render('posts', { posts: posts, headline: model.headline });
  }

  return controller;
}

