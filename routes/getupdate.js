var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Promise = require('promise');

var connected = false;


var connection = mysql.createConnection({
  host: 'localhost',
  user: 'espserver',
  password: '35p53rv3r',
  database: 'espserver'
});

connection.connect(function (err) {
  if (err) throw err
  console.log('You are now connected...')
  connected = true;
})

function sql_request_chipdata(chipid) {
  console.log("sql_request");
  return new Promise(function (fulfill, reject) {
    console.log("sql_request Promise");
    connection.query('SELECT * FROM espchips WHERE chip_id = ' + connection.escape(chipid), function (error, results, fields) {
      if (error) reject(error);
      else fulfill(results);
    });
  });
}

function sql_request_versiondata(md5) {
  console.log("sql_request");
  return new Promise(function (fulfill, reject) {
    console.log("sql_request Promise");
    connection.query('SELECT * FROM firmwareversions WHERE id_firmwareversions = ' + connection.escape(md5), function (error, results, fields) {
      if (error) reject(error);
      else fulfill(results);
    });
  });
}

function sql_insert_chipdata(chipid, current_md5) {
  connection.query('INSERT INTO espchips (chip_id, lastversion, lastupdaterequest) VALUES (?, ?, ?)', [connection.escape(chipid), connection.escape(current_md5), 'California, USA'],
    function (err, result) {

    }
  );
}

function sql_insert_versiondata(chipid, current_md5) {

}

function getAllowedResult(chipid) {
  console.log("getAllowedResult", chipid);
  return new Promise(function (fulfill, reject) {
    console.log("Promise1", chipid);
    sql_request_chipdata(chipid)
      .then((results) => {
        if (results.length > 0) {
          console.log(results[0].chip_id)
          console.log(results[0].allowedversion)
          return sql_request(results[0].allowedversion);
        }
        else {
          reject(new Error("Not in DB"));
        }
      },
      () => {
        console.log(error.code, ":", error.sqlMessage);
        reject(error);
      })
      .then((results) => {
        if (results.length > 0) {
          console.log(results[0].md5)
          console.log(results[0].data)
          fulfill(results);
        }
        else {
          reject(new Error("Not in DB"));
        }
      },
      () => {
        console.log(error.code, ":", error.sqlMessage);
        reject(error);
      });
  });
}

/* GET home page. */
router.get('/getupdate/:chip_id/:filename.:ext', function (req, res, next) {
  if (connected) {
    var current_md5 = req.headers["x-esp8266-sketch-md5"];
    var chipid = req.params["chip_id"];
    getAllowedResult(chipid)
      .then((firmwareresult) => {
        if (results.length > 0) {
          console.log(results[0].md5)
          console.log(results[0].data)
          if (results[0].md5 !== current_md5) {
            res.end(results[0].data, 'binary');
          }
          else {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
          }
        }
      },
      (error) => {
        console.log(error);
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
      });
  }
  else {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

module.exports = router;
