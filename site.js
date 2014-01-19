(function() {
  var express = require('express');

  exports.createDriver = function(port) {
    var app = express();

    app.use(express.logger());
    app.set('port', port || process.env.PORT || 3000);

    app.get('/', function(req, res){
      res.send('Hello World');
    });

    return {
      start: function(done) {
        this.server = app.listen(app.get('port'), function() {
          console.log('Express server started at http://localhost:' + app.get('port'));
          done && done();
        });
      },

      stop: function(done) {
        this.server.close(done);
      }
    };
  };
})()



