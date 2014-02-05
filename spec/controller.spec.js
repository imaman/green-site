var controllerModule = require('../controller.js');

describe('controller', function() {
  describe('posts', function() {
    var view = null;
    var data = null;
    var response = { 
      render: function(v, d) {
        view = v;
        data = d;
      }
    };

    it('returns all posts', function() {
      var posts = [ {id: 1, body: 'b_1'}, {id: 2, body: 'b_2___'}];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts(null, response);

      expect(view).toEqual('posts');
      expect(data.posts.map(function(x) { return x.body })).toEqual(['b_1', 'b_2']);
    });

    it('shows the most recent post first', function() {
      var monday = '2014-02-03T14:00:00Z';
      var tuesday = '2014-02-04T10:00:00Z';
      var posts = [ 
        {id: 1, publishedAt: monday, body: 'Post from Monday___'},
        {id: 2, publishedAt: tuesday, body: 'Post from Tuesday'}
      ];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts(null, response);

      expect(data.posts.map(function(x) { return x.body })).toEqual(
        ['Post from Tuesday', 'Post from Monday']);
    });
  });
});
