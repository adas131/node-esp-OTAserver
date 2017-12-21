var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var fileUpload = require('express-fileupload');

var app = express();

// Load settings
var settings = require("./settings");
if (settings.hostName) {
  app["hostName"] = settings.hostName;
}

// Setup DB connection
var dbConn = settings.setup(app);

generalSetup(app);

app.use('/', index);

var firmware = require('./routes/firmware');
firmware.setConnection(dbConn);
routePath('/firmware', firmware);

var getchiptypes = require('./routes/getchiptypes');
getchiptypes.setConnection(dbConn);
app.get('/getchiptypes/', getchiptypes);

var getupdate = require('./routes/getupdate');
getupdate.setConnection(dbConn);
app.get('/getupdate/:chip_id/:filename.:ext', getupdate);

var chiptype = require('./routes/chiptype');
chiptype.setConnection(dbConn);
routePath('/chiptype', chiptype);

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

function routePath(path, nodule) {
  app.get(path, nodule);
  app.post(path, nodule);
  app.get(path + "*", nodule);
  app.post(path + "*", nodule);
}

function generalSetup(appToUse) {
  // view engine setup
  appToUse.set('views', path.join(__dirname, 'views'));
  appToUse.set('view engine', 'jade');

  appToUse.use(logger('dev'));
  appToUse.use(bodyParser.json());
  appToUse.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true,
    parameterLimit: 1000000
  }));
  appToUse.use(cookieParser());
  appToUse.use(express.static(path.join(__dirname, 'public')));
  appToUse.use(fileUpload());

}

module.exports = app;
