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
        function rebind(ignore, next) { deployer.mostRecentRelease(stagingApp, next); },
        establishCandidate,
        checkNeedAndTest,
        testsCompleted,
        verifyAndDeploy,
        deploy).
        stop(postDeploy).
        apply();
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
    self.targets.push(current);
  });
  return this;
};

FunFlow.prototype.stop = function(t) {
  this.terminator = t;
  return this;
}

FunFlow.prototype.asFunction = function() {
  var self = this;
  function applyAt(e, args, i) {
    var fullArgs;
    if (i >= self.targets.length) {
      fullArgs = [e].concat(args).concat(next);
      console.log('TERMINATING ' + self.terminator);
      fullArgs && fullArgs.forEach(function(x) {
        console.log('    -' + x);
      });
      return self.terminator.apply(self, fullArgs);
    }
    fullArgs = args.concat(next);

    var target = self.targets[i];
    var f = target;
    console.log('calling ' + f);
    fullArgs && fullArgs.forEach(function(x) {
      console.log('    -' + x);
    });
    function next(en) {
      var xx = Array.prototype.slice.call(arguments, 1);
      console.log('xx=' + JSON.stringify(xx));
      return applyAt(en, xx, i + 1);
    };


    try {
      f.apply(fullArgs);
    } catch(e) {
      self.terminator(e);
    }
  };

  return function() {
    console.log('\n\n\n>>>>>>>>>>>>>>>>>>>>>>>>> STARTING');
    var argsAsArray = Array.prototype.slice.call(arguments, 0);
    applyAt(null, argsAsArray, 0);
  };
};

FunFlow.prototype.apply = function() {
  return this.asFunction()();
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
