var FunFlow = require('../funflow');

describe('FunFlow', function() {
  describe('seq', function() {
    it('is not allowed if no functions are specified', function(done) {
      expect(new FunFlow().seq).toThrow();
      done();
    });
    describe('of a single function', function() {
      it('does not fail', function(done) {
        new FunFlow().seq(function(err) {
          expect(err).toBeFalsy();  
          done();
        })();
      });
      it('passes no arguments if none were specified externally', function(done) {
        new FunFlow().seq(function(err) {
          expect(err).toBeFalsy();  
          expect(arguments.length).toEqual(1);
          done();
        })();
      });
      it('passes external arguments to that function', function(done) {
        new FunFlow().seq(function(err, first, second) {
          expect(err).toBeFalsy();  
          expect(first).toEqual('first external argument');
          expect(second).toEqual('second one');
          expect(arguments.length).toEqual(3);
          done();
        })('first external argument', 'second one');
      });
    });
    describe('of two functions', function() {
      it('passes the value emitted by the first one to the value argument of the second one', function(done) {
        new FunFlow().seq(function(next) { next(null, 'Lincoln') }, function(err, value) {
          expect(err).toBeFalsy();  
          expect(value).toEqual('Lincoln');
          expect(arguments.length).toEqual(2);
          done();
        })();
      });
      it('passes multiple values from the first to the second', function(done) {
        new FunFlow().seq(
          function(next) { next(null, 'Four scores', 'and', 'seven years ago') }, 
          function(err, part1, part2, part3) {
            expect(err).toBeFalsy();  
            expect([part1, part2, part3]).toEqual(['Four scores', 'and', 'seven years ago']);
            expect(arguments.length).toEqual(4);
            done();
        })();
      });
      it('passes multiple external args to the first function', function(done) {
        new FunFlow().seq(
          function(prefix, suffix, next) { next(null, prefix + '$' + suffix) },
          function(err, value) {
            expect(err).toBeFalsy();  
            expect(value).toEqual('<$>');
            expect(arguments.length).toEqual(2);
            done();
        })('<', '>');
      });
      it('passes the error emitted by the first one to the error argument of the second one', function(done) {
        var failure = new Error('some problem');
        new FunFlow().seq(function(next) { next('WE HAVE A PROBLEM') }, function(err) {
          expect(err).toEqual('WE HAVE A PROBLEM');
          done();
        })();
      });
      it('does not pass a value (even if it is specifed) when a failure is emitted', function(done) {
        var failure = new Error('some problem');
        new FunFlow().seq(function(next) { next(failure, 'some value') }, function(err) {
          expect(arguments.length).toEqual(1);
          done();
        })();
      });
      it('transform exceptions thrown by the first function into an error value (passed to the second)', function(done) {
        var failure = new Error('some problem');
        new FunFlow().seq(function() { throw failure }, function(err) {
          expect(err).toBe(failure);
          expect(arguments.length).toEqual(1);
          done();
        })();
      });
    });
  });
});
