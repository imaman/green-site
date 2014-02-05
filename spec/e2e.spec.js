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
      },
      {
        id: 3,
        title: 'Title3',
        publishedAt: ''
      },
      { 
        id: 4,
        title: 'Title4',
        body: 'some text `some code` the end',
        publishedAt: ''
      }
    ]
  };

  beforeEach(function(done) {
    browser = new Browser();
    driver = site.createDriver(3001, model);
    driver.start(done);
  });

  afterEach(function(done) {
    driver.stop(done);
  });

  function visit(path, done, callback) {
    browser.visit('http://localhost:3001/' + path, function() {
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

  it('uses the list of post as its welcome page', function(done) {
    visit('', done, function() {
      var text = browser.text();
      expect(text).toContain('Title1');
      expect(text).toContain('Title2');
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
        expect(text).toContain('Title2');
      });
    });
    it('extends the main layout', function(done) {
      visit('posts', done, function() {
        var text = browser.text();
        expect(text).toContain('Coding, design, and broken feedback loops');
      });
    });
  });

  describe('posts/:id/edit page', function() {
    it('shows an edit page', function(done) {
      visit('posts/1/edit', done, function() {
        expect(browser.success).toBe(true);
        expect(browser.html('#text-input-container')).toContain('<textarea id="text-input"'); 
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
    it('uses the post\'s title as the page title', function(done) {
      visit('posts/1', done, function() {
        expect(browser.success).toBe(true);
        expect(browser.text('title')).toContain('Title1');
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

  describe('posts body', function() {
    it('can be loaded from an external lookup function', function(done) {
      model.fetchBody = function(id, done) {
        if (id == '3') {
          done(null, 'body of 3');
        } else {
          done('no document found for ' + id);
        }
      };
      visit('posts/3', done, function() {
        expect(browser.success).toBe(true);
        expect(browser.text()).toContain('body of 3');
      });
    });
    it('can be retrieved as json', function(done) {
      model.fetchBody = function(id, done) {
        done(null, 'some *markdown* text');
      };
      visit('posts/3.json', done, function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('title');
        expect(text).toContain('id');
        expect(text).toContain('body');
        expect(text).toContain('publishedAt');
        expect(text).toContain('some *markdown* text');
      });
    });
  });
});
