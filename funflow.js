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

FunFlow.prototype.conc = function() {
  var functions = Array.prototype.slice.call(arguments, 0);
  return this.seq(function(next) { 
    var results = [];
    var count = functions.length;
    functions.forEach(function(f1, index) {
      f1(function(e) {
        if (e) return next(e);
        results[index] = Array.prototype.slice.call(arguments, 1);
        --count;
        if (count === 0) next.apply(null, [null].concat(results));
      });
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
