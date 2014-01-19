(function() {
  var express = require('express');
  var path = require('path');
  var jade = require('jade');

  exports.createDriver = function(port, model) {
    var app = express();

    app.use(express.logger());
    app.set('port', port || process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));

    app.get('/posts', function(req, res) {
      res.render('posts', { posts: model.posts, headline: model.headline });
    });

    app.get('/posts/:id', function(req, res) {
      res.render('post', { post: { title: 'T1', body: 'B1' }, headline: model.headline });
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



