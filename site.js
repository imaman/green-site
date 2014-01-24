(function() {
  var express = require('express');
  var jade = require('jade');
  var markdown = require('markdown').markdown;
  var moment = require('moment');
  var path = require('path');

  exports.createDriver = function(port, model) {
    var app = express();

    app.use(express.logger());
    app.set('port', port || process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));

    function listOfPosts(req, res) {
      res.render('posts', { posts: model.posts, headline: model.headline });
    }

    function singlePost(post, body, res) {
      var temp = Object.create(post);
      temp.body = markdown.toHTML(temp.body || body);
      temp.publishedAt = moment(temp.publishedAt).fromNow();
      res.render('post', { post: temp, headline: model.headline });
    }

    app.get('/', listOfPosts);
    app.get('/posts', listOfPosts);

    app.get('/edit', function(req, res) {
      res.redirect('/edit.html');
    });

    app.get('/posts/:id', function(req, res) {
      var post = null;
      model.posts.forEach(function(current) {
        if (current.id == req.params.id) {
          post = current;
        }
      });

      if (post) {
        if (post.body) {
          singlePost(post, null, res);
        } else {
          model.lookup(req.params.id, function(err, body) {
            singlePost(post, body, res);
          });
        }
      } else {
        res.send(404);
      }
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



