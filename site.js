var express = require('express');
var app = express();

app.use(express.logger());
app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
    res.send('Hello World');
});

app.listen(app.get('port'));
console.log('Express server started at http://localhost:' + app.get('port'));
