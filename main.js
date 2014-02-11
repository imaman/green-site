(function() {
  var model = require('./model');
  var controllerModule = require('./controller');

  require('./site').createDriver({},
    { model: model.production, controller: controllerModule.create() }, 
    { showWidgets: true, showFooter: true }).start();
})()
