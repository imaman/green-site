require('util-is');
var util = require('util');

function FunFlow(a, b) {
  this.trap = util.isFunction(a) ? a : b;
  var opts = util.isFunction(a) ? b : a;
  this.targets = [];
  this.options = opts || {};
}

FunFlow.prototype.seq = function() {
  this.targets = Array.prototype.slice.call(arguments, 0);
  this.trap && this.targets.push(this.trap);
  if (this.targets.length === 0) 
    throw new Error('At least one function must be specified');

  return this.asFunction();
};

FunFlow.prototype.conc = function(f1, f2) {
  if (!f2) {
    return this.seq(function(next) { 
      f1(function(e) {
        if (e) return next(e);
        next(null, Array.prototype.slice.call(arguments, 1));
      });
    });
  }

  return this.seq(function(next) { 
    var results = [null, null];
    var count = 2;
    f1(function(e) {
      if (e) return next(e);
      results[0] = Array.prototype.slice.call(arguments, 1);
      --count;
      if (count === 0) next(null, results[0], results[1]);
    });
    f2(function(e) {
      if (e) return next(e);
      results[1] = Array.prototype.slice.call(arguments, 1);
      --count;
      if (count === 0) next(null, results[0], results[1]);
    });
  });
};

FunFlow.prototype.asFunction = function() {
  var self = this;
  var trace = [];
  function applyAt(i, e) {
    var incomingArgs = Array.prototype.slice.call(arguments, 2);
    var f = self.targets[i];
    if (i === self.targets.length - 1) {
      return f.apply(null, [e].concat(incomingArgs));
    }

    trace.push('  at ' + (f.name || '?') + '()');


    function next() {
      var applyAtArgs = Array.prototype.slice.call(arguments, 0);
      if (applyAtArgs[0]) {
        applyAtArgs = [applyAtArgs[0]];
      }
      applyAtArgs = [i + 1].concat(applyAtArgs);
      return applyAt.apply(null, applyAtArgs);
    };


    var outgoingArgs = incomingArgs.concat([next]);
    try {
      if (e) return next(e);
      f.apply(null, outgoingArgs);
    } catch(e) {
      trace.push('FunFlow trace: '); 
      e.stack = e.stack + '\n' + trace.slice(0).reverse().join('\n');
      self.options.verbose && console.log('\n\ne.flowTrace=' + e.stack + '\n\n');
      next(e);
    }
  };

  return function() {
    var list = [0, null].concat(Array.prototype.slice.call(arguments, 0));
    applyAt.apply(null, list);
  };
};

module.exports = FunFlow;
