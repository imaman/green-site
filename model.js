(function() {
  var fs = require('fs');

  exports.production = {
    headline: 'Colliding Objects',
    posts: [ 
      {
        id: "intro",
        title: 'Does Design Exist?',
        publishedAt: '2014-01-23T20:35:00-05:00',
      },
      {
        id: "2",
        title: 'Testing with jasmine-node',
        publishedAt: '2014-01-29T14:39:00+02:00',
      }
    ],

    lookup: function(id, done) {
      fs.readFile(__dirname + '/posts/' + id, {encoding: 'utf8'}, function (err, data) {
        done(err, data);
      }); 
    }
  };
})();

