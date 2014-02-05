var moment = require('moment');

exports.a = function(x) {
};
exports.withModel = function(model) {
  return { 
    posts: function(req, res) {
      var posts = model.posts.map(function(post) {
        var result = Object.create(post);
        result.publishedAt = moment(result.publishedAt).fromNow();
        return result;
      });
      res.render('posts', { posts: posts, headline: model.headline });
    }
  };
};

