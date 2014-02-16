var rewire = require('rewire');
var promoter = rewire('../acceptance/promoter.js');

promoter.__set__('JasmineNodeApi', {});
promoter.__set__('acceptanceSpecs', {});
promoter.__set__('Deployer', {});



describe('promoter', function() {
  it('does something', function(done) {
    promoter('a', 'b');
    done();
  });
});

