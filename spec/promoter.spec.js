var rewire = require('rewire');
var promoter = rewire('../acceptance/promoter.js');


function JasmineNodeApiStub() {
  this.onCompletion = function(done) { this.done = done };
  this.runSpecs = function(specs, done) {
    (done || this.done)(null, { results: { failedCount: 0 }, lines: []});
  };
};

promoter.__set__('JasmineNodeApi', JasmineNodeApiStub);
promoter.__set__('acceptanceSpecs', {});

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
    promoter('a', 'b', false, { deployer: new DeployerStub() }, function(err, data) { 
      expect(err).toBe(null);
      expect(data).toBe('Deploying a_slug_id to app b {Promotion of: most_recent_at_a}');
      done();
    });
  });
});

