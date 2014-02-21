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

    describe('trap function', function() {
      it('can be passed to the ctor', function(done) {
        var captured;
        new FunFlow(function trap(e, v) { captured = Array.prototype.slice.call(arguments, 0) }).seq(
            function(next) { next(null, 3) },
            function(value, next) { next(null, value * value) }
        )();

        expect(captured).toEqual([null, 9]);
        done();
      });
      it('can be the sole target', function(done) {
        var captured;
        new FunFlow(function trap(e, v) { captured = Array.prototype.slice.call(arguments, 0) }).seq(
        )(50);

        expect(captured).toEqual([null, 50]);
        done();
      });
    });

    describe('error reporting', function() {
      it('generates a trace with meaningful function names', function(done) {
        new FunFlow().seq(
          function first(next) { next() }, 
          function second(next) { next() },
          function third(next) { throw new Error('ABORT') },
          function fourth(next) { next() },
          function final(e, v) {
            expect(e.stack).toContain('Error: ABORT');
            expect(e.stack).toContain('at third()');
            expect(e.stack).toContain('at second()');
            expect(e.stack).toContain('at first()');
            done();
          })();
      });
      it('handles unnamed function', function(done) {
        new FunFlow().seq(
          function (next) { next() }, 
          function second(next) { next() },
          function (next) { throw new Error('ABORT') },
          function (next) { next() },
          function final(e, v) {
            expect(e.stack).toContain('Error: ABORT');
            expect(e.stack).toContain('at ?()');
            expect(e.stack).toContain('at second()');
            expect(e.stack).toContain('at ?()');
            done();
          })();
      });
    });
  });

  describe('conc', function() {
    it('can execute a single function that emits a single value', function(done) {
      function trap(err, arr) {
        expect(arr).toEqual([ 'first' ]);
        done();
      }
      new FunFlow(trap).conc(
        function (next) { next(null, 'first') }
      )();
    });
    it('passes a failure from that single function to the trap funtion', function(done) {
      function trap(err) {
        expect(err).toEqual('WE HAVE A PROBLEM');
        expect(arguments.length).toEqual(1);
        done();
      }
      new FunFlow(trap).conc(
        function (next) { next('WE HAVE A PROBLEM', 'ignored') }
      )();
    });
    it('emits two arrays when two functions are specified', function(done) {
      function trap(err, arr1, arr2) {
        expect(arr1).toEqual([ 'FROM FIRST FUNCTION' ]);
        expect(arr2).toEqual([ 'FROM SECOND FUNCTION' ]);
        done();
      }
      new FunFlow(trap).conc(
        function(next) { next(null, 'FROM FIRST FUNCTION') },
        function(next) { next(null, 'FROM SECOND FUNCTION') }
      )();
    });
    it('supports multiple function with multiple emitted values', function(done) {
      function trap(err) {
        expect(err).toBe(null);
        expect(Array.prototype.slice.call(arguments, 1)).toEqual([ 
          ['v0_0', 'v0_1', 'v0_2'],
          ['v1_0'],
          ['v2_0', 'v2_1', 'v2_2', 'v2_3', 'v2_4'],
          ['v3_0', 'v3_1', 'v3_2'],
        ]);
        done();
      }
      new FunFlow(trap).conc(
        function(next) { next(null, 'v0_0', 'v0_1', 'v0_2') },
        function(next) { next(null, 'v1_0') },
        function(next) { next(null, 'v2_0', 'v2_1', 'v2_2', 'v2_3', 'v2_4') },
        function(next) { next(null, 'v3_0', 'v3_1', 'v3_2') }
      )();
    });
    it('wraps all the emitted values of the function in a single array', function(done) {
      function trap(err, arr) {
        expect(arr).toEqual([ 'first', 'second', 'third' ]);
        done();
      }
      new FunFlow(trap).conc(
        function (next) { next(null, 'first', 'second', 'third') }
      )();
    });
  });
});

