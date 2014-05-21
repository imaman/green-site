var Deployer = require('./deployer.js');
var funflow = require('funflow');

function main(stagingApp, prodApp, options, bail) {
  var out = options.out || console;
  var candidate = null;

  function postDeploy(data, next) {
    out.log('>>>>>>>>>> ALL\'S WELL');
    out.log(JSON.stringify(data, null, '  '));
    next(null, data);
  }

  function deploy(next) {
    out.log('Promoting slug ' + candidate.slug.id + ' to prod.');
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

    next(null);
  }

  function testsCompleted(outcome, next) {
    if (outcome.results.failedCount !== 0) return next(outcome.lines.join(''));
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

  if (!options.status) {
    return funflow.newFlow(
      function init(next) { deployer.init(next) },
      function fetchRelease(next) { deployer.mostRecentRelease(stagingApp, next) },
      establishCandidate,
      checkNeedAndTest,
      testsCompleted,
      verifyAndDeploy,
      deploy,
      postDeploy)(null, bail);
  }

  funflow.flow(bail).
    seq(deployer.init.bind(deployer)).
    conc({
      staged: deployer.mostRecentRelease.bind(deployer, stagingApp),
      live: deployer.mostRecentRelease.bind(deployer, prodApp)
    }).
    seq(function generateOutput(results, next) {
      next(null, Object.keys(results).map(function(key) {
        return key + '=' + JSON.stringify(results[key][0], null, '  ');
      }).join('\n'));
    }).run();
}

module.exports = main;
