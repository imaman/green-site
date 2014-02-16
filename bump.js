var exec = require('child_process').exec;
var Heroku = require('heroku-client');
var JasmineNodeApi = require('./acceptance/jasmine-node-api');
var acceptanceSpecs = require('./acceptance/specs.js');


function bail(value, err) {
  console.log(err.stack ? err.stack : err);
  process.exit(value);
}


function extractToken(callback) {
  return function(error, stdout, stderr) {
    var token = stdout.trim();
    callback(error || stderr, token);
  }
}

function Bumper() {}

Bumper.prototype.init = function(done) {
  var self = this;
  exec("heroku auth:token", extractToken(function(err, token) {
    if (err) return done(err);
    self.heroku = new Heroku({ token: token });
    done(null, self);
  }));
};

Bumper.prototype.fetchReleases = function(app, done) {
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

Bumper.prototype.deploy = function(app, slugId, description, done) {
  this.heroku.apps(app).releases().create({ 
      slug: slugId,
      description: description
    }, 
    done);
};


function main(stagingApp, prodApp, specs) {
  var candidate = null;
  var bumper = new Bumper();

  function testsCompleted(results, lines) {
    if (results.failedCount === 0) {
      return recheck(function(err) {
        if (err) return bail(1, err);
        console.log('Promoting slug ' + candidate.slug.id + ' to prod.');
        bumper.deploy(prodApp, candidate.slug.id, 'Promotion of: ' + candidate.description, function(err, data) {
          if (err) return bail(1, err);
          console.log('>>>>>>>>>> ALL\'S WELL');
          console.log(JSON.stringify(data, null, '  '));
          process.exit(0);
        });
      });
    } 
    console.log(lines.join(''));
    process.exit(1);
  }

  function recheck(done) {
    bumper.fetchReleases(stagingApp, function(err, rs) {
      var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
      if (slugged.length == 0) return done('no slugged releases');
      var latest = slugged[0];

      if (latest.version !== candidate.version || latest.slug.id !== candidate.slug.id) {
        console.log('**************************************************');
        console.log('*                                                *');
        console.log('* PROMOTION HALTED                               *');
        console.log('*                                                *');
        console.log('* Reason: Staging has changed mid-air            *');
        console.log('*                                                *');
        console.log('**************************************************');

        done(new Error('Staging has changed mid-air'));
      }

      done();
    });
  }

  bumper.init(function(err) {
    if (err) return bail(1, err);
    bumper.fetchReleases(stagingApp, function(err, rs) {
      var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
      if (slugged.length == 0) return bail(1, 'no slugged releases');
      candidate = slugged[0];

      var api = new JasmineNodeApi();
      api.onCompletion(testsCompleted);
      api.runSpecs(specs);
    });
  });
}


main('collidingobjects-staging', 'collidingobjects', acceptanceSpecs);


