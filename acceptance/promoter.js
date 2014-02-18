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

  function establishCandidate(err, mostRecent) {
    if (err) return bail(err);
    candidate = mostRecent;

    deployer.mostRecentRelease(prodApp, checkNeedAndTest);
  }

  function seq(r1, f1, r2, f2) {
    return function(arg) {
      f1.apply(r1, [arg, function(err, value) {
        f2.apply(r2, [err, value]);                
      }]);
    }
  }

  var deployer = new Deployer();
  deployer.init(function(err) {
    if (err) return bail(err);
    if (specs) {
      return seq(deployer, deployer.mostRecentRelease, null, establishCandidate)(stagingApp);
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
