var model =  require('../model');

describe('production model', function() {
  it('loads post body from a file', function(done) {
    model.production.lookup('fake_id', function(err, data) {
      expect(data.trim()).toEqual('this is not associated with any real post');
      done();
    });
  });
});

