var site =  require('../site');

describe("site", function(done) {
  it("should offer a .run method", function(done) {
    expect(site.run).not.toBe(null);
    done();
  });
});
