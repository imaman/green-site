function FunFlow() {
  this.targets = [];
}

FunFlow.prototype.seq = function() {
  var self = this;
  Array.prototype.slice.call(arguments, 0).forEach(function(current) {
    self.targets.push(current);
  });
  return this.asFunction();
};

FunFlow.prototype.asFunction = function() {
  var self = this;
  function applyAt(i, e) {
    var incomingArgs = Array.prototype.slice.call(arguments, 2);
    var f = self.targets[i];
    if (i == self.targets.length - 1) {
      return f.apply(null, [e].concat(incomingArgs));
    }


    function next() {
      return applyAt.apply(null, [i + 1].concat(Array.prototype.slice.call(arguments, 0)));
    };


    var outgoingArgs = incomingArgs.concat([next]);
    try {
      if (e) return next(e);
      f.apply(null, outgoingArgs);
    } catch(e) {
      next(e);
    }
  };

  return function() {
    var list = [0, null].concat(Array.prototype.slice.call(arguments, 0));
    applyAt.apply(null, list);
  };
};

module.exports = FunFlow;
