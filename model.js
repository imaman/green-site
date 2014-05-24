(function() {
  var fs = require('fs');

  exports.production = {
    headline: 'Colliding Objects',
    tagline: 'Coding, design, and broken feedback loops',
    posts: [
      {
        id: "intro",
        title: 'Does Design Exist?',
        publishedAt: '2014-01-23T20:35:00-05:00',
        options: { showFooter: false }
      },
      {
        id: "refactor_on_red",
        title: 'Refactor on Red ?!',
        publishedAt: '2014-01-29T14:39:00+02:00'
      },
      {
        id: "jasmine_node_failures_explained",
        title: 'Jasmine-Node\'s Test Failures Explained',
        publishedAt: '2014-02-04T10:12:00+02:00'
      },
      {
        id: "about",
        title: 'About - the Who, the Why, and the How',
        marks: [ 'meta' ],
        options: { showFooter: false },
        publishedAt: '2014-02-05T16:30:00+02:00'
      },
      {
        id: 'game_of_stubs',
        title: 'Game of Stubs',
        publishedAt: '2014-02-17T15:18:00+02:00'
      },
      {
        id: 'quality_metrics',
        title: 'This quality metric will self destruct in five seconds',
        marks: [ 'wip' ],
        publishedAt: '2014-05-24T15:18:00+03:00'
      },
    ],

    fetchBody: function(id, done) {
      fs.readFile(__dirname + '/posts/' + id, {encoding: 'utf8'}, function (err, data) {
        done(err, data);
      });
    }
  };
})();

