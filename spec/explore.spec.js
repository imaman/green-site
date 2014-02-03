describe('jasmine-node failure semantics', function() {
  it('times out if done() is not called', function(done) {
    done();
  });
});

