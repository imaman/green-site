describe('jasmine-node failure semantics', function() {
  it('times out if done() is not called', function(done) {
    done();
  });

  xit('assertion failures are not reported via exceptions', function(done) {
    var captured = null;
    try {
      expect(990099).toEqual(3);
    } catch(e) {
      captured = e;
    }
    expect(captured).toBe(null);
    done();
  });

  xit('two assertions can fail at the same test', function(done) {
    expect('first assetion').toEqual('is failing');
    expect('second assertion').toEqual('is also failing');
    done();
  });

  xit('treats exceptions at the main flow as failures', function(done) {
    throw new Error();
  });

  xit('exceptions thrown from side flows do not induce a failure', function(done) {
    setTimeout(function() {
      throw new Error();
    });
  });
  xit('even worse, if done() is called, a green summary line is printed', function(done) {
    setTimeout(function() {
      throw new Error();
    });
    done();
  });
  it('some assertion failure', function(done) {
    expect(2).toEqual(100);
    done();
  });
  it('to properly handle side flows, use --captureException and invoke done() from there', function(done) {
    setTimeout(function() {
      throw new Error();
      done();
    });
  });
  it('assertion failure in side flow', function(done) {
    setTimeout(function() {
      expect(4).toEqual(300);
      done();
    });
  });
});

