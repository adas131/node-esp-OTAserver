var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var upload = require('./routes/upload');
var getupdate = require('./routes/getupdate');
var getchiptypes = require('./routes/getchiptypes');
var chiptype = require('./routes/chiptype');
var fileUpload = require('express-fileupload');

var settings = require("./settings");
var app = express();

var dbConn = settings.setup(app);
if (settings.hostName) {
  app["hostName"] = settings.hostName;
}
getupdate.setConnection(dbConn);
getchiptypes.setConnection(dbConn);
upload.setConnection(dbConn);
chiptype.setConnection(dbConn);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  limit: '5mb',
  extended: true,
  parameterLimit: 1000000
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use('/', index);
app.get('/getchiptypes/', getchiptypes);
app.get('/getupdate/:chip_id/:filename.:ext', getupdate);
app.get('/upload', upload);
app.post('/upload', upload);
app.get('/chiptype', chiptype);
app.post('/chiptype', chiptype);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
