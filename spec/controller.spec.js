var controllerModule = require('../controller.js');

describe('controller', function() {
  describe('posts', function() {
    it('returns all posts', function() {
      var controller = controllerModule.withModel({ posts: [ {id: 1}, {id: 2}, {id: 3} ] });

      var view = null;
      var data = null;
      controller.posts(null, { render: function(v, d) {
        view = v;
        data = d
      }});
    });
  });
});
