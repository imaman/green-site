var exec = require('child_process').exec;
var Heroku = require('heroku-client');
var FunFlow = require('../funflow');

function extractToken(callback) {
  return function(error, stdout, stderr) {
    var token = stdout.trim();
    callback(error || stderr, token);
  }
}

function Deployer() {}

Deployer.prototype.init = function(done) {
  var self = this;
  exec("heroku auth:token", extractToken(function(err, token) {
    if (err) return done(err);
    self.heroku = new Heroku({ token: token });
    done(null);
  }));
};

Deployer.prototype.fetchReleases = function(app, done) {
  var appReleases = this.heroku.apps(app).releases();
  var self = this;
  new FunFlow().seq(
    function list(next) { self.heroku.apps(app).releases().list(next); },
    function sortByVersion(releases, next) {
      releases.sort(function compareByVersion(lhs, rhs) {
        var naturalOrder = lhs.version < rhs.version ? -1 
          : lhs.version > rhs.version ? 1
          : 0;
        return -naturalOrder;
      });
      next(null, releases);
    },
    done)();
};

Deployer.prototype.mostRecentRelease = function(app, done) {
  var self = this;
  new FunFlow().seq( 
    self.fetchReleases.bind(self, app),
    function(rs, next) {
      var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
      if (slugged.length == 0) return next(null, null);
      next(null, slugged[0]);
    },
    done)();
}

Deployer.prototype.deploy = function(app, slugId, description, done) {
  this.heroku.apps(app).releases().create({ 
      slug: slugId,
      description: description
    }, 
    done);
};

module.exports = Deployer;


