var site =  require('../site');
var Browser = require('zombie');

describe('site', function() {
  var browser;
  var driver;

  beforeEach(function(done) {
    browser = new Browser();
    driver = site.createDriver(3000);
    driver.start(done);
  });

  afterEach(function(done) {
    driver.stop(done);
  });

  it('should serve a "hello world" page', function(done) {
    browser.visit('http://localhost:3000/', function() {
      expect(browser.success).toBe(true);
      expect(browser.text()).toEqual('Hello World');
      done();
    });
  });
});
