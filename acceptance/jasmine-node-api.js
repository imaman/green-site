var jasmine = require('jasmine-node'); 
var util;
try {
  util = require('util')
} catch(e) {
  util = require('sys')
}

var jasmineEnv = jasmine.getEnv();

var it = function(desc, func, timeout) {
  return jasmine.getEnv().it(desc, func, timeout);
};
var beforeEach = function(func, timeout) {
  return jasmine.getEnv().beforeEach(func, timeout);
};
var afterEach = function(func, timeout) {
  return jasmine.getEnv().afterEach(func, timeout);
};

exports.runSpecs = function(specs, callback) {
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
        callback(e.results(), lines);
      },
      stackFilter: removeJasmineFrames
    }
  ));

  specs(describe, it, beforeEach, afterEach);
  jasmineEnv.execute();
};

