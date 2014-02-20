var Deployer = require('./deployer.js');
var FunFlow = require('../funflow.js');

function main(stagingApp, prodApp, options, bail) {
  var candidate = null;

  function postDeploy(data, next) {
    console.log('>>>>>>>>>> ALL\'S WELL');
    console.log(JSON.stringify(data, null, '  '));
    next(null, data);
  }

  function deploy(next) {
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
    return new FunFlow().seq(
      deployer.init.bind(deployer),
      deployer.mostRecentRelease.bind(deployer, stagingApp),
      establishCandidate,
      checkNeedAndTest,
      testsCompleted,
      verifyAndDeploy,
      deploy, 
      postDeploy,
      bail)();
  } 
  var text = [];
  function collect(title, v, next) {
    text.push(title + '=' + JSON.stringify(v, null, '  '));
    next();
  }

  return new FunFlow().seq(
    deployer.mostRecentRelease.bind(deployer, stagingApp), 
    collect.bind(null, 'staged'),
    deployer.mostRecentRelease.bind(deployer, prodApp), 
    collect.bind(null, 'live'),
    function(next) { next(null, text.join('\n')) },
    bail)();
}

module.exports = main;
