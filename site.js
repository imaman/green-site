(function() {
  var env = require('node-env-file');
  var express = require('express');
  var jade = require('jade');
  var moment = require('moment');
  var extend = require('node.extend');
  var path = require('path');
  var passport = require('passport');
  var TwitterStrategy = require('passport-twitter').Strategy;
  var FacebookStrategy = require('passport-facebook').Strategy;
  var GoogleStrategy = require('passport-google').Strategy;

  var devSecret = 'dev secret';

  exports.createDriver = function(overridingConf, deps, options) {
    var combinedConf = extend(process.env, overridingConf);

    var model = deps.model;
    var port = combinedConf.PORT || 3000;
    var hostAddress = combinedConf.GOOGLE_HOSTNAME || 'http://localhost:' + port;
    var controller = deps.controller.withModel(model, hostAddress, options || {});

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
        consumerSecret: combinedConf.TWITTER_CONSUMER_SECRET || devSecret,
        callbackURL: "/auth/twitter/callback"
      },
      function(token, tokenSecret, profile, done) {
        done(null, profile);
      }
    ));
    passport.use(new FacebookStrategy({
        clientID: "1404627676456080",
        clientSecret: combinedConf.FACEBOOK_APP_SECRET || devSecret,
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


    app.set('port', port);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(express.logger());
    app.use(express.cookieParser(combinedConf.COOKIE_SECRET || devSecret )); 
    app.use(express.bodyParser());
    app.use(express.cookieSession({ secret: combinedConf.COOKIE_SESSION_SECRET || devSecret }));
    app.use(express.methodOverride());
    app.use(express.session({ secret: combinedConf.SESSION_SECRET || devSecret }));
    app.use(passport.initialize());
    app.use(passport.session());    
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(controller.error);
    app.use(controller.pageNotFound);

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

    function authRoutes(provider) {
      app.get('/auth/' + provider, passport.authenticate(provider), 
        function(req, res) {} // will never be called.
      );
      app.get('/auth/' + provider + '/callback', 
        passport.authenticate(provider,
        { failureRedirect: '/login', successRedirect: '/' })
      );
    }

    authRoutes('twitter');
    authRoutes('facebook');
    authRoutes('google');

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
          console.log('combinedConf.NODE_ENV=' + combinedConf.NODE_ENV);
          console.log('Express server [' + app.get('env') + '] started at http://localhost:' + app.get('port'));
          done && done();
        });
      },

      stop: function(done) {
        this.server.close(done);
      }
    };
  };
})()



