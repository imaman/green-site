var model =  require('../model');

describe('production model', function() {
  it('loads post body from a file', function(done) {
    model.production.lookup('fake_id', function(err, data) {
      expect(data.trim()).toEqual('this is not associated with any real post');
      done();
    });
  });

  it('has a unique ID for every post', function(done) {
    var postById = {};
    model.production.posts.forEach(function(current) {
      expect(postById[current.id]).toBeFalsy();
      postById[current.id] = current;
    });
    done();
  });

  it('defines a body for every post', function(done) {
    var checked = 0;
    var minLength = 10;
    var bodyById = {};

    function oneDown() {
      checked += 1;
      if (checked < model.production.posts.length) {
        return;
      }

      try {
        Object.keys(bodyById).forEach(function(k) {
          var body = bodyById[k];
          expect(body).toBeTruthy();
          expect(body.length).toBeGreaterThan(minLength);
        });
      } catch(e) {}
      done();
    }
    model.production.posts.forEach(function(current) {
      if (current.body) {
        bodyById[current.id] = current.body;
        oneDown();
        return;
      }

      model.production.lookup(current.id, function(err, data) {
        bodyById[current.id] = data;
        oneDown();
      });
    });
  });
});

