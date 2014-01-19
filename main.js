(function() {
  var model = require('./model');

  require('./site').createDriver(3001, model.production).start();
})()
