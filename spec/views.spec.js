var jade = require('jade');
var path = require('path');

describe('post view', function() {
  function pathOf(filename) {
    return path.join(__dirname, '../views/', filename);
  }
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
  it('it does not show the widgets when the showWidgets option is false', function() {
    var html = jade.renderFile(pathOf('post.jade'), { 
      options: { showWidgets: false },
      post: {}
    });
    expect(html).not.toContain('addthis_config');
  });
  it('it does show the widgets when the showWidgets option is true', function() {
    var html = jade.renderFile(pathOf('post.jade'), { 
      options: { showWidgets: true },
      post: {}
    });
    expect(html).toContain('addthis_config');
  });
});