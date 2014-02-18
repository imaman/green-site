var JasmineNodeApi = require('./jasmine-node-api');
var acceptanceSpecs = require('./specs.js');
var Deployer = require('./deployer.js');

function main(stagingApp, prodApp, status, options, bail) {
  var specs = status ? null : (options.specs || acceptanceSpecs);
  var candidate = null;

  function postDeploy(err, data) {
    if (err) return bail(err);
    console.log('>>>>>>>>>> ALL\'S WELL');
    console.log(JSON.stringify(data, null, '  '));
    bail(null, data);
  }

  function deploy(err, ignore, next) {
    if (err) return bail(err);
    console.log('Promoting slug ' + candidate.slug.id + ' to prod.');
    deployer.deploy(prodApp, 
      candidate.slug.id, 
      'Promotion of: ' + candidate.description, 
      next);
  }

  function verifyAndDeploy(err, rs, next) {
    if (err) return next(err);
    var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
    if (slugged.length == 0) return next('no slugged releases', null);
    var latest = slugged[0];

    if (latest.version !== candidate.version || latest.slug.id !== candidate.slug.id) {
      return next('Staging has changed mid-air', null);
    }

    next(null, null);
  }

  function testsCompleted(err, outcome, next) {
    console.log('err=' + err + ', outcome=' + JSON.stringify(outcome) + ', next=' + next);
    if (outcome.results.failedCount !== 0) return bail(outcome.lines.join(''));
    deployer.fetchReleases(stagingApp, next);
  }

  function checkNeedAndTest(err, live, next) {
    if (err) return bail(err);
    if (live && (live.slug.id === candidate.slug.id)) {
      return bail('Slug at staging is already live in prod.');
    }

    var api = new JasmineNodeApi();
    new Seq().to(api, Seq.valDone(api.runSpecs)).stop(next).apply(specs);
  }

  function establishCandidate(err, mostRecent, next) {
    if (err) return bail(err);
    candidate = mostRecent;

    deployer.mostRecentRelease(prodApp, next);
  }


  var deployer = options.deployer || new Deployer();
  deployer.init(function(err) {
    if (err) return bail(err);
    if (specs) {
      return new Seq().
        to(deployer, Seq.valDone(deployer.mostRecentRelease)).
        to(establishCandidate).
        to(checkNeedAndTest).
        to(testsCompleted).
        to(verifyAndDeploy).
        to(deploy).
        stop(postDeploy).
        apply(stagingApp);
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

function Seq() {
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

Seq.prototype.asFunction = function() {
  var self = this;
  function applyAt(e, v, i) {
    if (i >= self.targets.length) {
      return self.terminator(e, v);
    }

    var target = self.targets[i];
    var f = target.f;
    var r = target.r;

    function next(en, vn) {
      return applyAt(en, vn, i + 1);
    };


    var args = [e, v, next];
    console.log('args=' + JSON.stringify(args));

    try {
      f.apply(r, args);
    } catch(e) {
      console.log('\n\n===================================================================\n' + e.stack);
      throw e;
    }
  };

  return function(arg) {
    applyAt(null, arg, 0);
  };
};

Seq.prototype.apply = function(arg) {
  return this.asFunction()(arg);
};

Seq.valDone = function(f) { 
  return function(e, v, next) {
    if (e) return next(e);
    return f(v, next);
  }
};

module.exports = main;
