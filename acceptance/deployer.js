var exec = require('child_process').exec;
var Heroku = require('heroku-client');
var flow = require('funflow').flow;

function extractToken(callback) {
  return function(error, stdout, stderr) {
  }
}

function Deployer() {}

Deployer.prototype.init = function(done) {
  var self = this;
  flow(done).seq(
    exec,
    function extractToken(stdout, stderr, next) {
      next(stderr, stdout.trim());
    },
    function assign(token, next) {
      self.heroku = new Heroku({ token: token });
      next();
    }).run("heroku auth:token");
};

Deployer.prototype.fetchReleases = function(app, done) {
  var self = this;
  flow(done).seq(
    function list(next) { self.heroku.apps(app).releases().list(next); },
    function sortByVersion(releases, next) {
      releases.sort(function (lhs, rhs) {
        var naturalOrder = lhs.version < rhs.version ? -1
          : lhs.version > rhs.version ? 1
          : 0;
        return -naturalOrder;
      });
      next(null, releases);
    }).run();
};

Deployer.prototype.mostRecentRelease = function(app, done) {
  var self = this;
  flow(done).seq(
    self.fetchReleases.bind(self, app),
    function(rs, next) {
      var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
      if (slugged.length == 0) return next(null, null);
      next(null, slugged[0]);
    }).run();
}

Deployer.prototype.deploy = function(app, slugId, description, done) {
  this.heroku.apps(app).releases().create({
      slug: slugId,
      description: description
    },
    done);
};

module.exports = Deployer;


