(function() {
  var env = require('node-env-file');
  var express = require('express');
  var jade = require('jade');
  var moment = require('moment');
  var mongo = require('mongodb');
  var session = require('express-session');
  var MongoStore = require('connect-mongo')(session);
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var cookieSession = require('cookie-session');
  var methodOverride = require('method-override');
  var morgan = require('morgan');
  var logger = morgan('combined');
  var extend = require('node.extend');
  var path = require('path');
  var passport = require('passport');
  var TwitterStrategy = require('passport-twitter').Strategy;
  var FacebookStrategy = require('passport-facebook').Strategy;
  var GoogleStrategy = require('passport-google').Strategy;
  var funflow = require('funflow');

  function loadConf(name) {
    return require('./conf/' + name);
  }

  function check(map, keys) {
    keys.forEach(function(key) {
      if (map[key] == undefined) {
        throw new Error('.' + key + ' is not defined in ' + map.NODE_ENV);
      }
    });
  }

  function createApp(combinedConf, deps, options, done) {
    var model = deps.model;
    var port = combinedConf.PORT;
    var hostAddress = combinedConf.GOOGLE_HOSTNAME;
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


    passport.use(new TwitterStrategy({
        consumerKey: "FCvT4ed7oo1N8YvB1o5pQ",
        consumerSecret: combinedConf.TWITTER_CONSUMER_SECRET,
        callbackURL: "/auth/twitter/callback"
      },
      function(token, tokenSecret, profile, done) {
        done(null, profile);
      }
    ));
    passport.use(new FacebookStrategy({
        clientID: "1404627676456080",
        clientSecret: combinedConf.FACEBOOK_APP_SECRET,
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

    mongo.Db.connect(combinedConf.MONGOLAB_URI, function(err, db) {
      if (err) return done(err);

      deps.db = db;

      app.use(logger);
      app.use(cookieParser(combinedConf.COOKIE_SECRET));
      app.use(bodyParser.json());
      app.use(cookieSession({ secret: combinedConf.COOKIE_SESSION_SECRET}));
      app.use(methodOverride());
      app.use(session({
        secret: combinedConf.SESSION_SECRET,
        store: new MongoStore({
          db : db
        })
//        resave: true,
//        saveUninitialized: true
      }));
      app.use(passport.initialize());
      app.use(passport.session());

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
          return;
        }

        if (post.body) {
          callback(post);
          return;
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
            res.status(404).end();
          }
        });
      });

      app.get('/posts/:id/edit', function(req, res) {
        res.sendFile(__dirname + '/public/edit.html');
      });

      app.use(express.static(__dirname + '/public'));
      app.use(controller.error);
      app.use(controller.pageNotFound);
      done(null, app);
    });
  }

  exports.createDriver = function(overridingConf, deps, options) {
    try {
      env(__dirname + '/conf/.env');
    } catch(e) {
      // Intentionally ignore.
    }
    var confName = process.env.NODE_ENV || 'development';
    var combinedConf = extend(
      loadConf('default'),
      process.env,
      loadConf(confName),
      overridingConf,
      {NODE_ENV: confName}
    );

    // Sanity checks on the configuration (hard to unit-test).
    check(combinedConf, ['PORT', 'NODE_ENV', 'TWITTER_CONSUMER_SECRET', 'COOKIE_SESSION_SECRET']);
    if (combinedConf.NODE_ENV === 'production' && combinedConf.TWITTER_CONSUMER_SECRET === combinedConf.FACEBOOK_APP_SECRET) {
      throw new Error('Same consumer secret for two different providers in ' + combinedConf.NODE_ENV);
    };
    if (!combinedConf.PORT) {
      throw new Error('No .PORT value is specified');
    }


    var flow = funflow.newFlow(
      function create(initDone, combinedConf, deps, options, next) {
        this.initDone = initDone;
        createApp(combinedConf, deps, options, next);
      },
      function listen(app, next) { this.app = app; this.server = app.listen(app.get('port'), next) },
      function serverIsUp(next) {
        console.log(combinedConf.VERTICAL_SPACE + '> Express server [' + combinedConf.NODE_ENV
          + '] started at http://localhost:' + this.app.get('port') + combinedConf.VERTICAL_SPACE);
        next();
      },
      funflow.comp(function yield(e, next) {
        this.initDone(e);
        this.resume = next;
      }),
      function closeServer(shutdownDone, next) {
        this.shutdownDone = shutdownDone;
        this.server.close(next);
      },
      function dbClose(next) { deps.db.close(next); },
      funflow.comp(function(e, next) { this.shutdownDone(e); next(); })
    );
    var driver = {
      start: function(initDone) {
        var exec = flow(null, initDone, combinedConf, deps, options, function(err) {
          if(err)
            console.error(err.flowTrace);
        });

        driver.stop = function(shutdownDone) {
          exec.context.shutdownDone = shutdownDone;
          exec.context.resume(null, shutdownDone);
        }
      }
    };
    return driver;
  };
})()



