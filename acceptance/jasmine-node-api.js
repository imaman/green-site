var jasmine = require('jasmine-node');
var util;
try {
  util = require('util')
} catch(e) {
  util = require('sys')
}

var jasmineEnv = new Jasmine.Env();
console.log(Object.keys(jasmineEnv).join(', '));

var it = function(desc, func, timeout) {
  return jasmine.getEnv().it(desc, func, timeout);
};
var beforeEach = function(func, timeout) {
  return jasmine.getEnv().beforeEach(func, timeout);
};
var afterEach = function(func, timeout) {
  return jasmine.getEnv().afterEach(func, timeout);
};

function JasmineNodeApi() {
  this.completion = function() {};
}

JasmineNodeApi.prototype.onCompletion = function(callback) {
  this.completion = callback;
}

JasmineNodeApi.prototype.runSpecs = function(specs, done) {
  var self = this;
  var lines = [];
  function print(str) {
    lines.push(util.format(str));
  }

  function removeJasmineFrames(text) {
    return text;
  }

  jasmineEnv.addReporter(new jasmine.TerminalVerboseReporter({
      print: print,
      color: true,
      onComplete: function(e) {
        var actual = done || self.completion;
        actual(null, { results: e.results(), lines: lines});
      },
      stackFilter: removeJasmineFrames
    }
  ));

  specs(describe, it, beforeEach, afterEach);
  jasmineEnv.execute();
};

module.exports = JasmineNodeApi;

