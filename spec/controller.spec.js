var controllerModule = require('../controller.js');

describe('controller', function() {
  describe('posts', function() {
    it('returns all posts', function() {
      var posts = [ {id: 1, body: 'b_1'}, {id: 2, body: 'b_2'}];
      var controller = controllerModule.withModel({ posts: posts });

      var view = null;
      var data = null;
      controller.posts(null, { render: function(v, d) {
        view = v;
        data = d
      }});

      expect(view).toEqual('posts');
      expect(data.posts.map(function(x) { return x.body })).toEqual(['b_1', 'b_2']);
    });
  });
});
