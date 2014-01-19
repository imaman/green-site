var site =  require('../site');
var Browser = require('zombie');

describe('site', function() {
  var browser;
  var s;

  beforeEach(function(done) {
    browser = new Browser();
    s = site.create(3000);
    s.start(done);
  });

  afterEach(function(done) {
    s.stop(done);
  });

  it('should serve a "hello world" page', function(done) {
    browser.visit('http://localhost:3000/', function() {
      expect(browser.success).toBe(true);
      expect(browser.text()).toEqual('Hello World');
      done();
    });
  });
});
