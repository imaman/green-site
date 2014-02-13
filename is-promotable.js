var GitHubApi = require("github");
var Browser = require('zombie');
var jasmine = require('jasmine-node'); 
var util;
try {
  util = require('util')
} catch(e) {
  util = require('sys')
}
var github = new GitHubApi({
    version: "3.0.0",
});


var jasmineEnv = jasmine.getEnv();

it = function(desc, func, timeout) {
    return jasmine.getEnv().it(desc, func, timeout);
};
beforeEach = function(func, timeout) {
    return jasmine.getEnv().beforeEach(func, timeout);
};
afterEach = function(func, timeout) {
    return jasmine.getEnv().afterEach(func, timeout);
};

describe('staged deployment', function() {
  var browser = new Browser();

  function visit(path, done, callback) {
    browser.visit('http://collidingobjects-staging.herokuapp.com/' + path, function() {
      callback();
      done();
    });
  }

  it('serves static files from the public/ dir.', function(done) {
    visit('main.css', done, function() {
      expect(browser.success).toBe(true);
      var text = browser.text();
      expect(text).toContain('body');
      expect(text).toContain('font-family');
    });
  });


  it('provides an RSS feed', function(done) {
    visit('rss.xml', done, function() {
      expect(browser.success).toBe(true);
      var text = browser.text();
      var xml = browser.html();
      expect(xml).toContain('atom');
      expect(xml).toContain('rss');
      expect(text).toContain('Does Design Exist?');
    });
  });
});

function extractCommit(callback) {
  github.repos.getBranch(
    {user: 'imaman', repo: 'green-site', branch: 'master'}, 
    callback);
}


(function() {
  var lines = [];
  var commit = null;
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
        if (e.results().failedCount === 0) {
          return recheck();
        } 
        console.log(lines.join(''));
        process.exit(1);
      },
      stackFilter: removeJasmineFrames
    }
  ));

  function recheck() {
    extractCommit(function(err, data) {
      if (err) { console.log(err); process.exit(1); }
      if (commit !== data.commit.sha) {
        process.exit(1);
      }

      console.log(data.commit.sha); 
      process.exit(0);
    });
  }

  extractCommit(function(err, data) {
    if (err) { console.log(err.stack); process.exit(1); }
    commit = data.commit.sha;
    jasmineEnv.execute();
  });
})();
                                                         

