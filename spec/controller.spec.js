var controllerModule = require('../controller.js');

describe('controller', function() {
  describe('posts', function() {
    it('returns all posts', function() {
      var controller = controllerModule.withModel({ posts: [ {id: 1}, {id: 2}, {id: 3} ] });
      controller.posts();
    });
  });
});
