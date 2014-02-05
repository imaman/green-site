var jade = require('jade');
var path = require('path');

describe('views', function() {
  function pathOf(filename) {
    return path.join(__dirname, '../views/', filename);
  }

  describe('/post', function() {
    it('renders a post', function() {
      var html = jade.renderFile(pathOf('post.jade'), { 
        options: {},
        post: {
          id: 1, 
          title: 'Title',
          body: 'Body'
        }
      });
      expect(html).toContain('Title');
      expect(html).toContain('Body');
    });

    it('by default, it does not show the widgets', function() {
      var html = jade.renderFile(pathOf('post.jade'), { 
        options: {},
        post: {}
      });
      expect(html).not.toContain('addthis_config');
    });
    it('does not show the widgets when the showWidgets option is false', function() {
      var html = jade.renderFile(pathOf('post.jade'), { 
        options: { showWidgets: false },
        post: {}
      });
      expect(html).not.toContain('addthis_config');
    });
    it('does show the widgets when the showWidgets option is true', function() {
      var html = jade.renderFile(pathOf('post.jade'), { 
        options: { showWidgets: true },
        post: {}
      });
      expect(html).toContain('addthis_config');
    });
    it('does not show the footer when the showFooter option is false', function() {
      var html = jade.renderFile(pathOf('post.jade'), { 
        options: { showFooter: false },
        post: {}
      });
      expect(html).not.toContain('(c) Itay Maman');
    });
    it('does show the footer when the showFooter option is true', function() {
      var html = jade.renderFile(pathOf('post.jade'), { 
        options: { showFooter: true },
        post: {}
      });
      expect(html).toContain('(c) Itay Maman');
    });
  });
  describe('/posts', function() {
    it('does not show the footer', function() {
      var html = jade.renderFile(pathOf('posts.jade'), { posts: [] });
      expect(html).not.toContain('(c) Itay Maman');
    });
  });
});

