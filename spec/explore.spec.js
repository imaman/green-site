describe('jasmine-node failure semantics', function() {
  it('times out if done() is not called', function(done) {
    done();
  });

  it('assertion failures are not reported via exceptions', function(done) {
    var captured = null;
    try {
      expect(990099).toEqual(3);
    } catch(e) {
      captured = e;
    }
    expect(captured).toBe(null);
    done();
  });

  it('two assertions can fail at the same test', function(done) {
    expect('first assetion').toEqual('is failing');
    expect('second assertion').toEqual('is also failing');
    done();
  });
});

