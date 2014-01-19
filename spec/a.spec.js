var site =  require('../site');
var Browser = require('zombie');

describe('site', function() {
  var browser;
  var driver;

  var model = {
    posts: [ 
      {
        id: 1,
        title: 'T1',
        body: 'B1',
        published: '2014-01-11T11:11:11-05:00',
      },
      {
        id: 2,
        title: 'T2',
        body: 'B2',
        published: '2014-02-22T22:22:22-05:00',
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

  describe('/posts page', function() {
    it('should list all posts', function(done) {
      browser.visit('http://localhost:3000/posts', function() {
        expect(browser.success).toBe(true);
        var text = browser.text();
        expect(text).toContain('T1');
        expect(text).toContain('T2');
        done();
      });
    });
  });
});
