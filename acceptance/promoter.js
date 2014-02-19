var Deployer = require('./deployer.js');

function main(stagingApp, prodApp, options, bail) {
  var candidate = null;

  function postDeploy(err, data) {
    if (err) return bail(err);
    console.log('>>>>>>>>>> ALL\'S WELL');
    console.log(JSON.stringify(data, null, '  '));
    bail(null, data);
  }

  function deploy(ignore, next) {
    console.log('Promoting slug ' + candidate.slug.id + ' to prod.');
    deployer.deploy(prodApp, 
      candidate.slug.id, 
      'Promotion of: ' + candidate.description, 
      next);
  }

  function verifyAndDeploy(rs, next) {
    var slugged = rs.filter(function(x) { return x.slug && x.slug.id });
    if (slugged.length == 0) return next('no slugged releases', null);
    var latest = slugged[0];

    if (latest.version !== candidate.version || latest.slug.id !== candidate.slug.id) {
      return next('Staging has changed mid-air', null);
    }

    next(null, null);
  }

  function testsCompleted(outcome, next) {
    if (outcome.results.failedCount !== 0) return bail(outcome.lines.join(''));
    deployer.fetchReleases(stagingApp, next);
  }

  function checkNeedAndTest(live, next) {
    if (live && (live.slug.id === candidate.slug.id)) {
      throw new Error('Slug at staging is already live in prod.');
    }

    options.runSpecs(next);
  }

  function establishCandidate(mostRecent, next) {
    candidate = mostRecent;

    deployer.mostRecentRelease(prodApp, next);
  }


  var deployer = options.deployer || new Deployer();
  deployer.init(function(err) {
    if (err) return bail(err);
    if (!options.status) {
      return new FunFlow().seq(
        deployer.mostRecentRelease.bind(deployer),
        establishCandidate,
        checkNeedAndTest,
        testsCompleted,
        verifyAndDeploy,
        deploy).
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

function FunFlow() {
  this.targets = [];
}

FunFlow.prototype.seq = function() {
  var self = this;
  Array.prototype.slice.call(arguments, 0).forEach(function(current) {
    self.to(FunFlow.valDone(current));
  });
  return this;
};

FunFlow.prototype.to = function(r, f) {
  this.targets.push({ r: f ? r : null, f: f || r });
  return this;
}

FunFlow.prototype.stop = function(t) {
  this.terminator = t;
  return this;
}

FunFlow.prototype.asFunction = function() {
  var self = this;
  function applyAt(i, e) {
    var incomingArgs = Array.prototype.slice.call(arguments, 2);
    var v = incomingArgs[0];
    if (i >= self.targets.length) {
      return self.terminator.apply(null, [e].concat(incomingArgs));
    }

    var target = self.targets[i];
    var f = target.f;
    var r = target.r;

    function next(en, vn) {
      return applyAt.apply(null, [i + 1, en].concat(incomingArgs));
    };


    var args = [e, v, next];
    try {
      f.apply(r, args);
    } catch(e) {
      console.log('\n\n===================================================================\n' + e.stack);
      throw e;
    }
  };

  return function() {
    var list = [0, null].concat(Array.prototype.slice.call(arguments, 0));
    applyAt.apply(null, list);
  };
};

FunFlow.prototype.apply = function(arg) {
  return this.asFunction()(arg);
};

FunFlow.valDone = function(f) { 
  return function(e, v, next) {
    if (e) return next(e);
    try {
      return f(v, next);
    } catch (e) {
      next(e);
    }
  }
};

module.exports = main;
