var site =  require('../site');
var Browser = require('zombie');

describe('site', function() {
  var browser;
  var driver;

  var model = {
    headline: 'SOME HEADLINE',
    posts: [ 
      {
        id: 1,
        title: 'T1',
        body: 'B1',
        publishedAt: '2014-01-11T11:11:11-05:00',
      },
      {
        id: 2,
        title: 'T2',
        body: 'B2',
        publishedAt: '2014-02-22T22:22:22-05:00',
      }
    ]
  };

  beforeEach(function(done) {
    browser = new Browser();
    driver = site.createDriver(3000, model);
    driver.start(done);
  });

  afterEach(function(done) {
    driver.stop(done);
  });

  it('serves static files from the public/ dir.', function(done) {
    browser.visit('http://localhost:3000/main.css', function() {
      expect(browser.success).toBe(true);
      var text = browser.text();
      expect(text).toContain('.title');
      expect(text).toContain('font-family');
      done();
    });
  });

  describe('/posts page', function() {
    it('shows the headline', function(done) {
      browser.visit('http://localhost:3000/posts', function() {
        expect(browser.text()).toContain('SOME HEADLINE');
        done();
      });
    });

    it('should list all posts', function(done) {
      browser.visit('http://localhost:3000/posts', function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('T1');
        expect(text).toContain('2014-01-11');
        expect(text).toContain('T2');
        expect(text).toContain('2014-02-22');
        done();
      });
    });
    it('extends the main layout', function(done) {
      browser.visit('http://localhost:3000/posts', function() {
        var text = browser.text();
        expect(text).toContain('THIS IS THE FOOTER');
        done();
      });
    });
  });

  describe('/posts/:id page', function() {
    it('shows the title and body of a post', function(done) {
      browser.visit('http://localhost:3000/posts/1', function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('T1');
        expect(text).toContain('B1');
        done();
      });
    });
    it('does not show content from other posts', function(done) {
      browser.visit('http://localhost:3000/posts/2', function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('T2');
        expect(text).not.toContain('T1');
        done();
      });
    });
    it('fails if post ID is not recognized', function(done) {
      browser.visit('http://localhost:3000/posts/some_non_existing_post_id', function() {
        expect(browser.success).toBe(false);
        done();
      });
    });
  });
});