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
});
