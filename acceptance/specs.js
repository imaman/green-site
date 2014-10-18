module.exports = function(describe, it, beforeEach, afterEach) {
  describe('acceptance criteria', function() {
    var Browser = require('zombie');
    var browser = new Browser();

    function visit(path, done, callback) {
      if (path[0] == '/') {
        path = path.substr(1);
      }
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
}

