var controllerModule = require('../controller.js');

describe('controller', function() {
  describe('posts', function() {
    it('returns all posts', function() {
      var posts = [ {id: 1, body: 'b1'}, {id: 2, body: 'b2'}];
      var controller = controllerModule.withModel({ posts: posts });

      var view = null;
      var data = null;
      controller.posts(null, { render: function(v, d) {
        view = v;
        data = d
      }});

      expect(data.posts).toEqual([]);
    });
  });
});
