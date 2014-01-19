(function() {
  var fs = require('fs');

  exports.production = {
    headline: 'Bits in Motion',
    posts: [ 
      {
        id: 1,
        title: 'T1',
        body: 'B1',
        publishedAt: '2014-01-11T11:11:11-05:00',
      },
      {
        id: 2,
        title: 'T2',
        body: 'B2',
        publishedAt: '2014-02-22T22:22:22-05:00',
      },
      {
        id: 3,
        title: '',
        publishedAt: ''
      }
    ],

    lookup: function(id, done) {
      fs.readFile(__dirname + '/posts/' + id, {encoding: 'utf8'}, function (err, data) {
        done(err, data);
      }); 
    }
  };
})();

