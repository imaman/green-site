var extend = require('node.extend');
var markdown = require('markdown').markdown;
var moment = require('moment');
var Rss = require('rss');

exports.withModel = function(model, hostAddress, options) {
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
    res.render('posts', { posts: posts, headline: model.headline, tagline: model.tagline, user: req.user && req.user.displayName });
  };

  controller.singlePost = function(post, req, res) {
    var temp = Object.create(post);
    temp.body = markdown.toHTML(temp.body);
    temp.publishedAt = moment(temp.publishedAt).fromNow();
    res.render('post', { post: temp, headline: model.headline, tagline: model.tagline, user: req.user && req.user.displayName, options: extend({}, options, post.options) });
  }

  controller.rss = function(res) {
    var latest = model.posts.map(function(post) { return new Date(post.publishedAt).getTime(); }).reduce(function(a,b) {
      return (a > b) ? a : b;
    }, 0);
    var feed = new Rss({
        title: model.headline,
        description: model.tagLine,
        feed_url: hostAddress + '/rss.xml',
        site_url: hostAddress,
        image_url: hostAddress,
        author: 'Itay Maman',
        copyright: '2014 Itay Maman',
        language: 'en',
        pubDate: new Date(latest).toString(),
        ttl: '10'
    });      

    var left = model.posts.length;
    function publish(post, body) {
      feed.item({
          title:  post.title,
          description: markdown.toHTML(post.body || body),
          url: hostAddress + '/posts/' + post.id,
          date: post.publishedAt,
      });
      --left;
      if (left == 0) {
        res.set('Content-Type', 'text/xml');
        res.send(feed.xml(2));
      }
    }

    model.posts.forEach(function(post) {
      if (post.body) {
        publish(post);
        return;
      }
      model.fetchBody(post.id, function(err, body) {
        publish(post, body);
      });
    });
  };

  return controller;
}

