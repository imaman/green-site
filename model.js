(function() {
  var fs = require('fs');

  exports.production = {
    headline: 'Colliding Objects',
    posts: [ 
      {
        id: 1,
        title: 'Pilot',
        body: 'To be comleted',
        publishedAt: '2014-01-11T11:11:11-05:00',
      }
    ],

    lookup: function(id, done) {
      fs.readFile(__dirname + '/posts/' + id, {encoding: 'utf8'}, function (err, data) {
        done(err, data);
      }); 
    }
  };
})();

