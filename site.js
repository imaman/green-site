(function() {
  var env = require('node-env-file');
  var express = require('express');
  var jade = require('jade');
  var moment = require('moment');
  var extend = require('node.extend');
  var path = require('path');
  var controllerModule = require('./controller');
  var passport = require('passport');
  var TwitterStrategy = require('passport-twitter').Strategy;
  var FacebookStrategy = require('passport-facebook').Strategy;
  var GoogleStrategy = require('passport-google').Strategy;

  var devSecret = 'dev secret';

  exports.createDriver = function(port_, model, options) {
    var port = port_ || process.env.PORT || 3000;
    var hostAddress = process.env.GOOGLE_HOSTNAME || 'http://localhost:' + port;
    model.users = model.users || {};
    passport.serializeUser(function(user, done) {
      model.users[user.id] = user;
      done(null, user.id);
    });

    passport.deserializeUser(function(obj, done) {
      var res = model.users[obj];
      done(null, res || null);
    });

    try {
      env(__dirname + '/.env'); 
    } catch(e) {
      // Intentionally ignore.
    }

    passport.use(new TwitterStrategy({
        consumerKey: "FCvT4ed7oo1N8YvB1o5pQ",
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET || devSecret,
        callbackURL: "/auth/twitter/callback"
      },
      function(token, tokenSecret, profile, done) {
        done(null, profile);
      }
    ));
    passport.use(new FacebookStrategy({
        clientID: "1404627676456080",
        clientSecret: process.env.FACEBOOK_APP_SECRET || devSecret,
        callbackURL: "//collidingobjects.herokuapp.com/auth/facebook/callback",
      },
      function(accessToken, refreshToken, profile, done) {
        return done(null, profile);
      }
    ));

    passport.use(new GoogleStrategy({
        returnURL: hostAddress + '/auth/google/callback',
        realm: hostAddress
      },
      function(identifier, profile, done) {
        profile.id = identifier;
        return done(null, profile);
      }
    ));
    var app = express();

    var controller = controllerModule.withModel(model, hostAddress, options || {});

    app.set('port', port);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(express.logger());
    app.use(express.cookieParser(process.env.COOKIE_SECRET || devSecret )); 
    app.use(express.bodyParser());
    app.use(express.cookieSession({ secret: process.env.COOKIE_SESSION_SECRET || devSecret }));
    app.use(express.methodOverride());
    app.use(express.session({ secret: process.env.SESSION_SECRET || devSecret }));
    app.use(passport.initialize());
    app.use(passport.session());    
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));

    app.get('/rss.xml', function(req, res) {
      controller.rss(res);
    });

    app.get('/login', function(req, res) {
      res.render('login', { headline: model.headline });
    });

    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });

    app.get('/auth/twitter', passport.authenticate('twitter'), 
      function(req, res) {} // will never be called.
    );
    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', 
      { failureRedirect: '/login', successRedirect: '/' })
    );

    app.get('/auth/facebook', passport.authenticate('facebook'),
      function(req, res) {} // will never be called.
    );
    app.get('/auth/facebook/callback', 
      passport.authenticate('facebook', 
      { failureRedirect: '/login', successRedirect: '/' })
    );

    app.get('/auth/google', passport.authenticate('google'),
      function(req, res) {} // will never be called.
    );
    app.get('/auth/google/callback', 
      passport.authenticate('google', 
      { failureRedirect: '/login', successRedirect: '/' })
    );

    app.get('/', controller.posts);
    app.get('/posts', controller.posts);

    app.get('/edit', function(req, res) {
      res.redirect('/edit.html');
    });

    app.get('/env.json', function(req, res) {
      res.json({ 
      });
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
          controller.singlePost(post, req, res);
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



