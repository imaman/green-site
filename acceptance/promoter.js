var JasmineNodeApi = require('./jasmine-node-api');
var acceptanceSpecs = require('./specs.js');
var Deployer = require('./deployer.js');

function main(stagingApp, prodApp, status, bail) {
  var specs = status ? null : acceptanceSpecs;
  var candidate = null;

  function postDeploy(err, data) {
    if (err) return bail(err);
    console.log('>>>>>>>>>> ALL\'S WELL');
    console.log(JSON.stringify(data, null, '  '));
    bail(null, data);
  }

  function deploy(err) {
    if (err) return bail(err);
    console.log('Promoting slug ' + candidate.slug.id + ' to prod.');
    deployer.deploy(prodApp, 
      candidate.slug.id, 
      'Promotion of: ' + candidate.description, 
      postDeploy);
  }

  function verifyAndDeploy(err, rs) {
    var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
    if (slugged.length == 0) return bail('no slugged releases');
    var latest = slugged[0];

    if (latest.version !== candidate.version || latest.slug.id !== candidate.slug.id) {
      return deploy('Staging has changed mid-air');
    }

    deploy(null);
  }

  function testsCompleted(results, lines) {
    if (results.failedCount !== 0) return bail(lines.join(''));
    deployer.fetchReleases(stagingApp, verifyAndDeploy);
  }

  function checkNeedAndTest(err, live) {
    if (err) return bail(err);
    if (live && (live.slug.id === candidate.slug.id)) {
      return bail('Slug at staging is already live in prod.');
    }

    var api = new JasmineNodeApi();
    api.onCompletion(testsCompleted);
    api.runSpecs(specs);
  }

  function establishCandidate(err, mostRecent, next) {
    if (err) return bail(err);
    candidate = mostRecent;

    deployer.mostRecentRelease(prodApp, next);
  }

  var Seq = function() {
    this.targets = [];
  }
  Seq.prototype.to = function(r, f) {
    this.targets.push({ r: f ? r : null, f: f || r });
    return this;
  }

  Seq.prototype.stop = function(t) {
    this.terminator = t;
    return this;
  }

  Seq.prototype.apply = function(arg, done) {
    var self = this;
    function applyAt(e, v, i) {
      if (i >= self.targets.length) {
        return self.terminator(e, v);
      }

      var target = self.targets[i];
      var f = target.f;
      var r = target.r;

      var next = function(en, vn) {
        applyAt(en, vn, i + 1);
      };


      var args = [e, v, next];
      if (f.length === 2) {
        args = [v, next];
      }

      try {
        f.apply(r, args);
      } catch(e) {
        console.log('\n\n===================================================================\n' + e.stack);
        throw e;
      }
    };

    applyAt(null, arg, 0);
  };

  var deployer = new Deployer();
  deployer.init(function(err) {
    if (err) return bail(err);
    if (specs) {
      return new Seq().to(deployer, deployer.mostRecentRelease).to(establishCandidate).stop(checkNeedAndTest).apply(stagingApp);
    } else {
      deployer.mostRecentRelease(stagingApp, function(err, staged) {
        if (err) return bail(err);
        console.log('staged=' + JSON.stringify(staged, null, '  '));
        deployer.mostRecentRelease(prodApp, function(err, live) {
          if (err) return bail(err);
          console.log('live=' + JSON.stringify(live, null, '  '));
        });
      });
    }
  });
}

module.exports = main;
