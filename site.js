(function() {
  var express = require('express');
  var jade = require('jade');
  var markdown = require('markdown').markdown;
  var moment = require('moment');
  var extend = require('node.extend');
  var path = require('path');

  exports.createDriver = function(port, model, displayOptions) {
    var display = displayOptions || {};
    var app = express();

    app.use(express.logger());
    app.set('port', port || process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));

    function listOfPosts(req, res) {
      if (display.secure) {
        if (req.protocol != 'https' && req.host != 'localhost') {
          var target = 'https://' + req.host;
          console.log('redirecting to ' + target);
          res.redirect(target);
          return;
        }
      }
      var posts = model.posts.map(function(post) {
        var result = Object.create(post);
        result.publishedAt = moment(result.publishedAt).fromNow();
        return result;
      });
      res.render('posts', { posts: posts, headline: model.headline });
    }

    function singlePost(post, res) {
      var temp = Object.create(post);
      temp.body = markdown.toHTML(temp.body);
      temp.publishedAt = moment(temp.publishedAt).fromNow();
      res.render('post', { post: temp, headline: model.headline, display: display });
    }

    app.get('/', listOfPosts);
    app.get('/posts', listOfPosts);

    app.get('/edit', function(req, res) {
      res.redirect('/edit.html');
    });

    function lookup(id, callback) {
      var post = null;
      model.posts.forEach(function(current) {
        if (current.id == id) {
          post = current;
        }
      });

      if (!post) {
        callback(null);
      }

      if (post.body) {
        callback(post);
      }
      model.fetchBody(id, function(err, body) {
        callback(extend({body: body}, post));
      });
    }

    app.get('/posts/:id.json', function(req, res) {
      lookup(req.params.id, function(post) {
        res.json(post);
      });
    });

    app.get('/posts/:id', function(req, res) {
      lookup(req.params.id, function(post) {
        if (post) {
          singlePost(post, res);
        } else {
          res.send(404);
        }
      });
    });

    app.get('/posts/:id/edit', function(req, res) {
      res.sendfile(__dirname + '/public/edit.html');
    });

    return {
      start: function(done) {
        this.server = app.listen(app.get('port'), function() {
          console.log('Express server started at http://localhost:' + app.get('port'));
          done && done();
        });
      },

      stop: function(done) {
        this.server.close(done);
      }
    };
  };
})()



