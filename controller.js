var markdown = require('markdown').markdown;
var moment = require('moment');

exports.withModel = function(model, options) {
  var controller = {};
  controller.posts = function(req, res) {
    var sorted = model.posts.filter(function(x) {
      return !x.marks || x.marks.indexOf('main') >= 0;
    });
    sorted.sort(function(lhs, rhs) {
      return new Date(rhs.publishedAt).getTime() - new Date(lhs.publishedAt).getTime();
    });

    var posts = sorted.map(function(post) {
      var result = Object.create(post);
      result.publishedAt = moment(result.publishedAt).fromNow();
      return result;
    });
    res.render('posts', { posts: posts, headline: model.headline });
  };

  controller.singlePost = function(post, res) {
    var temp = Object.create(post);
    temp.body = markdown.toHTML(temp.body);
    temp.publishedAt = moment(temp.publishedAt).fromNow();
    res.render('post', { post: temp, headline: model.headline, options: options });
  }

  return controller;
}

