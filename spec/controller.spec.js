var controllerModule = require('../controller.js');

describe('controller', function() {
  var view = null;
  var data = null;
  var status = null;
  var type = null;
  var response = { 
    render: function(v, d) {
      view = v;
      data = d;
    },

    status: function(s) {
      status = s;
    },

    send: function(d) { 
      data = d;
    },

    type: function(t) {
      type = t;
      return this;
    }
  };

  describe('page not found', function() {
    it('returns a web-page when client expects html', function() {
      var controller = controllerModule.withModel({}, '');

      controller.pageNotFound({ url: 'non_existing_url', accepts: function(x) { return x == 'html' } }, response);

      expect(view).toEqual('404');
      expect(status).toEqual(404);
      expect(data).toEqual({url: 'non_existing_url'});
    });
    it('returns json when client expects json', function() {
      var controller = controllerModule.withModel({}, '');

      controller.pageNotFound({ url: 'non_existing_url', accepts: function(x) { return x == 'json' } }, response);

      expect(status).toEqual(404);
      expect(data).toEqual({ error: 'Not found',  url: 'non_existing_url'});
    });
    it('returns plain text otherwise', function() {
      var controller = controllerModule.withModel({}, '');

      controller.pageNotFound({ url: 'non_existing_url', accepts: function(x) { return false } }, response);

      expect(status).toEqual(404);
      expect(type).toEqual('txt');
      expect(data).toEqual('Not found');
    });
  });

  describe('single post', function() {
    it('translates markdown to HTML', function() {
      var controller = controllerModule.withModel({}, '');

      controller.singlePost({ id: 1, body: 'plain text and **bolded text**' }, {}, response);

      expect(view).toEqual('post');
      expect(data.post.body).toEqual('<p>plain text and <strong>bolded text</strong></p>');
    });
    it('passes the options down to the view', function() {
      var controller = controllerModule.withModel({}, '', { option_a: 1, option_b: 2 });

      controller.singlePost({ id: 1, body: '' }, {}, response);

      expect(data.options).toEqual({ option_a : 1, option_b: 2 });
    });
    it('allows the post to override the options', function() {
      var controller = controllerModule.withModel({}, '', { option_a: 1, option_b: 2 });

      controller.singlePost({ id: 1, body: '', options: { option_a: 110011 } }, {}, response);

      expect(data.options).toEqual({ option_a : 110011, option_b: 2 });
    });
  });

  describe('posts', function() {

    function renderedPosts() { 
      return data.posts.map(function(x) { return x.body }); 
    }

    it('returns all posts', function() {
      var posts = [{id: 1, body: 'b_1'}, {id: 2, body: 'b_2'}];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts({}, response);

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

      controller.posts({}, response);

      expect(renderedPosts()).toEqual(['Post from Tuesday', 'Post from Monday']);
    });

    it('shows only posts marked as "main" or that have no mark', function() {
      var posts = [ 
        {id: 1, body: 'post', marks: ['main']},
        {id: 2, body: 'FILTERED_OUT', marks: ['secondary']},
        {id: 3, body: 'another_post'},
      ];
      var controller = controllerModule.withModel({ posts: posts });

      controller.posts({}, response);

      expect(renderedPosts()).not.toContain('FILTERED_OUT');
    });
  });
});
