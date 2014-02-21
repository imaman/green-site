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

FunFlow.prototype.conc = function(f) {
  return this.seq(function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var outerNext = args[args.length - 1];
    args[args.length - 1] = function() {
      var argsToNext = Array.prototype.slice.call(arguments, 0);
      return outerNext(null, argsToNext);
    };
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
