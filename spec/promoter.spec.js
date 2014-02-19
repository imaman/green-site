var rewire = require('rewire');
var promoter = rewire('../acceptance/promoter.js');


function runSpecs(done) {
  done(null, { results: { failedCount: 0 }, lines: []});
}


function DeployerStub() {
  this.init = function(done) { done(); };
  this.mostRecentRelease = function(app, done) { done(null, { description: 'most_recent_at_' + app, slug: { id: app + '_slug_id' }}); };
  this.fetchReleases = function(app, done) { done(null, [ { slug: { id: app + '_slug_id' }} ]); };
  this.deploy = function(app, slug, description, done) { 
    done(null, 'Deploying ' + slug + ' to app ' + app+ ' {' + description + '}');
  };
}

describe('promoter', function() {
  it('deploys most recent slug of one application to another application', function(done) {
    promoter('a', 'b', { deployer: new DeployerStub(), runSpecs: runSpecs }, function(err, data) { 
      expect(err).toBe(null);
      expect(data).toBe('Deploying a_slug_id to app b {Promotion of: most_recent_at_a}');
      done();
    });
  });
  it('reports an error if init fails', function(done) {
    var deployer = new DeployerStub();
    deployer.init = function(done) { done('SOME PROBLEM'); };
    promoter('a', 'b', { deployer: deployer , runSpecs: runSpecs }, function(err, data) { 
      expect(err).toEqual('SOME PROBLEM');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('reports an error if mostRecentRelease fails', function(done) {
    var problem = new Error('SOMETHING WENT WRONG');
    var deployer = new DeployerStub();
    deployer.mostRecentRelease = function(app, done) { done(problem); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) { 
      expect(err).toBe(problem);
      expect(data).toBe(undefined);
      done();
    });
  });
  it('reports an error if fetchReleases fails', function(done) {
    var deployer = new DeployerStub();
    deployer.fetchReleases = function(app, done) { done('FAILURE IN deployer.fetchReleases()'); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) { 
      expect(err).toEqual('FAILURE IN deployer.fetchReleases()');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('reports an error if deploy fails', function(done) {
    var deployer = new DeployerStub();
    deployer.deploy = function(app, slug, description, done) { done('FAILURE IN deployer.deploy()'); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) { 
      expect(err).toEqual('FAILURE IN deployer.deploy()');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('does not deploy if both apps run the same slug', function(done) {
    var deployer = new DeployerStub();
    deployer.mostRecentRelease = function(app, done) { done(null, { description: 'DESC', slug: { id: 'SLUG_ID' }}); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) { 
      expect(err.message).toEqual('Slug at staging is already live in prod.');
      expect(data).toBe(undefined);
      done();
    });
  });
});

