(function() {
  var express = require('express');

  exports.run = function(port) {
    var app = express();

    app.use(express.logger());
    app.set('port', port || process.env.PORT || 3000);

    app.get('/', function(req, res){
        res.send('Hello World');
    });

    app.listen(app.get('port'));
    console.log('Express server started at http://localhost:' + app.get('port'));
  };

})()



