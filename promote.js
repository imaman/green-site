#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2));
var JasmineNodeApi = require('./acceptance/jasmine-node-api');
var acceptanceSpecs = require('./acceptance/specs.js');
var Deployer = require('./acceptance/deployer.js');


function bail(err) {
  if (err.stack) {
    console.log(err.stack);
    process.exit(1);
  }

  console.log('**************************************************');
  console.log('*                                                *');
  console.log('* PROMOTION HALTED                               *');
  console.log('*                                                *');
  console.log('* Reason: ' + err);
  console.log('*                                                *');
  console.log('**************************************************');
  process.exit(1);
}


function main(stagingApp, prodApp, specs) {
  var candidate = null;

  function postDeploy(err, data) {
    if (err) return bail(err);
    console.log('>>>>>>>>>> ALL\'S WELL');
    console.log(JSON.stringify(data, null, '  '));
    process.exit(0);
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
    if (slugged.length == 0) return done('no slugged releases');
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

  var deployer = new Deployer();
  deployer.init(function(err) {
    if (err) return bail(err);
    if (specs) {
      return deployer.mostRecentRelease(stagingApp, establishCandidate);
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

main('collidingobjects-staging', 'collidingobjects', argv.status ? null : acceptanceSpecs);


