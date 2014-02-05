var controllerModule = require('../controller.js');

describe('controller', function() {
  var view = null;
  var data = null;
  var response = { 
    render: function(v, d) {
      view = v;
      data = d;
    }
  };

  describe('single post', function() {
    it('translates markdown to HTML', function() {
      var controller = controllerModule.withModel({});

      controller.singlePost({ id: 1, body: 'plain text and **bolded text**' }, response);

      expect(view).toEqual('post');
      expect(data.post.body).toEqual('<p>plain text and <strong>bolded text</strong></p>');
    });
    it('passes the options down to the view', function() {
      var controller = controllerModule.withModel({}, { option_a: 1, option_b: 2 });

      controller.singlePost({ id: 1, body: '' }, response);

      expect(data.options).toEqual({ option_a : 1, option_b: 2 });
    });
  });

  describe('posts', function() {

    function renderedPosts() { 
      return data.posts.map(function(x) { return x.body }); 
    }

    it('returns all posts', function() {
      var posts = [{id: 1, body: 'b_1'}, {id: 2, body: 'b_2'}];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts(null, response);

      expect(view).toEqual('posts');
      expect(renderedPosts()).toEqual(['b_1', 'b_2']);
    });

    it('shows the most recent post first', function() {
      var monday = '2014-02-03T14:00:00Z';
      var tuesday = '2014-02-04T10:00:00Z';
      var posts = [ 
        {id: 1, publishedAt: monday, body: 'Post from Monday'},
        {id: 2, publishedAt: tuesday, body: 'Post from Tuesday'}
      ];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts(null, response);

      expect(renderedPosts()).toEqual(['Post from Tuesday', 'Post from Monday']);
    });

    it('shows only posts marked as "main" or that have no mark', function() {
      var posts = [ 
        {id: 1, body: 'post', marks: ['main']},
        {id: 2, body: 'FILTERED_OUT', marks: ['secondary']},
        {id: 3, body: 'another_post'},
      ];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts(null, response);

      expect(renderedPosts()).not.toContain('FILTERED_OUT');
    });
  });
});
