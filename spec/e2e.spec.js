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
        title: 'Title1',
        body: 'B1',
        publishedAt: '2014-01-11T11:11:11-05:00',
      },
      {
        id: 2,
        title: 'Title2',
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

  function visit(path, done, callback) {
    browser.visit('http://localhost:3000/' + path, function() {
      callback();
      done();
    });
  }

  it('serves static files from the public/ dir.', function(done) {
    visit('main.css', done, function() {
      expect(browser.success).toBe(true);
      var text = browser.text();
      expect(text).toContain('.title');
      expect(text).toContain('font-family');
    });
  });

  describe('/posts page', function() {
    it('shows the headline', function(done) {
      visit('posts', done, function() {
        expect(browser.text()).toContain('SOME HEADLINE');
      });
    });

    it('should list all posts', function(done) {
      visit('posts', done, function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('Title1');
        expect(text).toContain('2014-01-11');
        expect(text).toContain('Title2');
        expect(text).toContain('2014-02-22');
      });
    });
    it('extends the main layout', function(done) {
      visit('posts', done, function() {
        var text = browser.text();
        expect(text).toContain('THIS IS THE FOOTER');
      });
    });
  });

  describe('/posts/:id page', function() {
    it('shows the title and body of a post', function(done) {
      visit('posts/1', done, function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('Title1');
        expect(text).toContain('B1');
      });
    });
    it('does not show content from other posts', function(done) {
      visit('posts/2', done, function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('Title2');
        expect(text).not.toContain('Title1');
      });
    });
    it('fails if post ID is not recognized', function(done) {
      visit('posts/some_non_existing_post_id', done, function() {
        expect(browser.success).toBe(false);
      });
    });
  });
});
