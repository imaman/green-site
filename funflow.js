require('util-is');
var util = require('util');

function FunFlow(a, b) {
  this.trap = util.isFunction(a) ? a : b;
  var opts = util.isFunction(a) ? b : a;
  this.targets = [];
  this.options = opts || {};
}

FunFlow.prototype.toString = function() {
  var arr = this.targets.slice(0);
  return arr.map(function(x, index) { return '<' + index + '> ' + (x.name || '??') + '()'; }).join('\n');
};

FunFlow.prototype.seq = function() {
  this.targets = this.targets.concat(Array.prototype.slice.call(arguments, 0));
  if (!this.trap && this.targets.length === 0) 
    throw new Error('At least one function must be specified');

  return this;
};

FunFlow.prototype.conc = function() {
  var functions = Array.prototype.slice.call(arguments, 0);
  var self = this;
  return this.seq(function(next) { 
    var results = [];
    var count = functions.length;
    functions.forEach(function(f, index) {
      f(function(e) {
        var data = Array.prototype.slice.call(arguments, 1);
        if (e) return next(e);
        results[index] = data;
        --count;
        if (count === 0) return next.apply(null, [null].concat(results));
      });
    });
  });
};

FunFlow.prototype.asFunction = function() {
  var functions = this.targets.slice(0);
  this.trap && functions.push(this.trap);
  var self = this;
  var trace = [];
  function applyAt(i, e) {
    var incomingArgs = Array.prototype.slice.call(arguments, 2);
    var f = functions[i];
    if (i === functions.length - 1) {
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

FunFlow.prototype.run = function() {
  this.asFunction().apply(null, Array.prototype.slice.call(arguments, 0));
};

module.exports = FunFlow;
