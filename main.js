(function() {
  var model = require('./model');
  var controllerModule = require('./controller');

  var driver = require('./site').createDriver(
    { VERTICAL_SPACE: '\n>\n>\n>\n>\n>\n' },
    { model: model.production, controller: controllerModule.create() }, 
    { showWidgets: true, showFooter: true });
  driver.start(function(err) {
    if (err) throw err;
  });
})()
