(function() {
  var model = require('./model');
  var controllerModule = require('./controller');

  require('./site').createDriver({
      VERTICAL_SPACE: '\n>\n>\n>\n>\n>\n'
    },
    { model: model.production, controller: controllerModule.create() }, 
    { showWidgets: true, showFooter: true }).start();
})()
