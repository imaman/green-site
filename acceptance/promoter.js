var exec = require('child_process').exec;
var Heroku = require('heroku-client');

function extractToken(callback) {
  return function(error, stdout, stderr) {
    var token = stdout.trim();
    callback(error || stderr, token);
  }
}

function Promoter() {}

Promoter.prototype.init = function(done) {
  var self = this;
  exec("heroku auth:token", extractToken(function(err, token) {
    if (err) return done(err);
    self.heroku = new Heroku({ token: token });
    done(null, self);
  }));
};

Promoter.prototype.fetchReleases = function(app, done) {
  this.heroku.apps(app).releases().list(function(err, releases) { 
    if (err) return done(err);
    releases.sort(function(lhs, rhs) {
      var naturalOrder = lhs.version < rhs.version ? -1 
        : lhs.version > rhs.version ? 1
        : 0;
      return -naturalOrder;
    });
    done(null, releases);
  });
};

Promoter.prototype.deploy = function(app, slugId, description, done) {
  this.heroku.apps(app).releases().create({ 
      slug: slugId,
      description: description
    }, 
    done);
};

module.exports = Promoter;


