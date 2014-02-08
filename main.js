(function() {
  var model = require('./model');
  var controllerModule = require('./controller');

  require('./site').createDriver(null, 
    { model: model.production, controller: controllerModule }, 
    { showWidgets: true, showFooter: true }).start();
})()
