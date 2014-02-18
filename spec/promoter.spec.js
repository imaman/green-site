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
  this.mostRecentRelease = function(app, done) { done(null, { description: 'recent', slug: { id: app + '_slug_id' }}); };
  this.fetchReleases = function(app, done) { done(null, [ { slug: { id: app + '_slug_id' }} ]); };
  this.deploy = function(app, slug, description, done) { 
    done(null, 'Deploying ' + slug + '/' + description + ' to ' + app); 
  };
}

promoter.__set__('Deployer', DeployerStub);




describe('promoter', function() {
  it('does something', function(done) {
    promoter('a', 'b', false, function(err, data) { 
      expect(err).toBe(null);
      expect(data).toBe('Deploying a_slug_id/Promotion of: recent to b');
      done();
    });
  });
});

