var rewire = require('rewire');
var promoter = rewire('../acceptance/promoter.js');


function JasmineNodeApiStub() {
  this.onCompletion = function(done) { this.done = done };
  this.runSpecs = function(specs) {
    this.done({ failedCount: 0 });
  };
};

promoter.__set__('JasmineNodeApi', JasmineNodeApiStub);
promoter.__set__('acceptanceSpecs', {});

function DeployerStub() {
  this.init = function(done) { done(); };
  this.mostRecentRelease = function(app, done) { done(null, { slug: { id: app + '_slug_id' }}); };
  this.fetchReleases = function(app, done) { done(null, [ { slug: { id: app + '_slug_id' }} ]); };
  this.deploy = function(app, slug, description, done) { done(null); };
}

promoter.__set__('Deployer', DeployerStub);




describe('promoter', function() {
  it('does something', function(done) {
    promoter('a', 'b', false, function(err) { 
      expect(err).toBe(null);
      done();
    });
  });
});

