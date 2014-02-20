function FunFlow() {
  this.targets = [];
}

FunFlow.prototype.seq = function() {
  if (arguments.length === 0) 
    throw new Error('At least one function must be specified');

  var self = this;
  Array.prototype.slice.call(arguments, 0).forEach(function(current) {
    self.targets.push(current);
  });
  return this.asFunction();
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

    trace.push(f.name + '()');


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
      trace.push('Error: ' + e.message); 
      e.flowTrace = trace.slice(0).reverse().join('\n');
      next(e);
    }
  };

  return function() {
    var list = [0, null].concat(Array.prototype.slice.call(arguments, 0));
    applyAt.apply(null, list);
  };
};

module.exports = FunFlow;
