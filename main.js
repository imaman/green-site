(function() {
  var model = require('./model');

  require('./site').createDriver(null, model.production, { twitterButton: true, secure: true }).start();
})()
