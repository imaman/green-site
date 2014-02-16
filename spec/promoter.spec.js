var rewire = require('rewire');
var promoter = rewire('../acceptance/promoter.js');


function JasmineNodeApiStub() {
};

promoter.__set__('JasmineNodeApi', JasmineNodeApiStub);
promoter.__set__('acceptanceSpecs', {});

function DeployerStub() {
  this.init = function(done) { done(); };
  this.mostRecentRelease = function(app, done) { done(null, { slug: { id: app + '_slug_id' }}); };
}

promoter.__set__('Deployer', DeployerStub);



describe('promoter', function() {
  it('does something', function(done) {
    promoter('a', 'b');
    done();
  });
});

