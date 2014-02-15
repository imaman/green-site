var jasmineNodeApi = require('./jasmine-node-api');
var extractCommit = require('./commit-query')('imaman', 'green-site', 'master').extractCommit;

describe('acceptance criteria', function() {
  var Browser = require('zombie');
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

  it('serves a single post', function(done) {
    visit('posts/intro', done, function() {
      expect(browser.success).toBe(true);
      expect(browser.text()).toContain('The purposeful or inventive arrangement of parts or details');
    });
  });

  it('serves a list of posts', function(done) {
    visit('posts', done, function() {
      expect(browser.success).toBe(true);
      expect(browser.text()).toContain('Refactor on Red ?!');
      expect(browser.text()).toContain('Does Design Exist?');
    });
  });

  describe('a user can authenticate with', function() {
    it('Twitter', function(done) {
      visit('login', function() {}, function() {
        expect(browser.success).toBe(true);
        var href = browser.xpath('//a[contains(text(), "Twitter")]/@href').iterateNext();
        visit(href.textContent, done, function() {
          expect(browser.success).toBe(true);
          expect(browser.location.href).toContain('https://api.twitter.com/oauth/authenticate?oauth_token=');
        });
      });
    });
    it('Facebook', function(done) {
      visit('login', function() {}, function() {
        expect(browser.success).toBe(true);
        var href = browser.xpath('//a[contains(text(), "Facebook")]/@href').iterateNext();
        visit(href.textContent, done, function() {
          expect(browser.success).toBe(true);
          expect(browser.location.href).toContain('https://www.facebook.com/login.php?');
          expect(browser.location.href).toContain('api_key');
        });
      });
    });
  });
});


(function() {
  function completionCallback(results, lines) {
    if (results.failedCount === 0) {
      return recheck();
    } 
    console.log(lines.join(''));
    process.exit(1);
  }

  function recheck() {
    extractCommit(function(err, commitData) {
      if (err) { console.log(err); process.exit(1); }
      if (commit !== commitData.sha) {
        console.log('**************************************************');
        console.log('*                                                *');
        console.log('* PROMOTION HALTED                               *');
        console.log('*                                                *');
        console.log('* Reason: Staging has changed mid-air            *');
        console.log('* From: ' + commit + ' *');
        console.log('*   To: ' + commitData.sha + ' *');
        console.log('*                                                *');
        console.log('**************************************************');

        process.exit(1);
      }

      console.log(commitData.sha); 
      process.exit(0);
    });
  }

  extractCommit(function(err, commitData) {
    if (err) { console.log(err.stack); process.exit(1); }
    commit = commitData.sha;
    jasmineNodeApi.runSpecs(completionCallback);
  });
})();

