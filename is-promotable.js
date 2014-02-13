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

github.repos.getBranch(
  {user: 'imaman', repo: 'green-site', branch: 'master'}, 
  function(err, data) { 
    if (err) return console.log(err.stack); 
    console.log(data.commit.sha); 
  }
);


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

(function() {
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
        if (e.results().failedCount === 0) {
          process.exit(0);
        } 
        console.log(lines.join(''));
        process.exit(1);
      },
      stackFilter: removeJasmineFrames
    }
  ));
})();
                                                         
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

jasmineEnv.execute();

