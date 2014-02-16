#!/usr/bin/env node

var JasmineNodeApi = require('./acceptance/jasmine-node-api');
var acceptanceSpecs = require('./acceptance/specs.js');
var Promoter = require('./acceptance/promoter.js');


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
    promoter.deploy(prodApp, 
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
    promoter.fetchReleases(stagingApp, verifyAndDeploy);
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

    promoter.mostRecentRelease(prodApp, checkNeedAndTest);
  }

  var promoter = new Promoter();
  promoter.init(function(err) {
    if (err) return bail(err);
    if (acceptanceSpecs) {
      return promoter.mostRecentRelease(stagingApp, establishCandidate);
    }
  });
}

main('collidingobjects-staging', 'collidingobjects', acceptanceSpecs);


