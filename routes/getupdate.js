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

function checkChipInDb(current_md5, chipid) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM espchips WHERE chip_id = ' + connection.escape(chipid), function (error, results, fields) {
      if (error) {
        reject('Not Found');
      }
      else {
        if (results.length > 0) {
          resolve(results[0]);
        }
        else {
          insertNewChip(chipid, current_md5);
          reject('Not Found');
        }
      }
    });
  });
}

function getVersionFromDb(md5) {
  console.log("getVersionFromDb", md5);
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM firmwareversions WHERE md5 = ?', [md5], function (error, results, fields) {
      if (error) {
        reject('Not Found');
      }
      else {
        if (results.length > 0) {
          resolve(results[0]);
        }
        else {
          insertNewFirmwareVersion(md5);
          reject('Not Found');
        }
      }
    });
  });
}

function insertNewFirmwareVersion(md5) {
  console.log("insertNewFirmwareVersion");
  var qry1 = connection.query('INSERT INTO firmwareversions(md5) values (?)', [md5], function (error, results, fields) {
  });
}

function insertNewChip(chipid, current_md5) {
  getVersionFromDb(current_md5)
    .then((result) => {
      var qry2 = connection.query('INSERT INTO espchips(chip_id, lastversion, lastrequest) values (?, ?, ?)', [chipid, result.md5, Date.now()], function (error, results, fields) {
      });
    })
}



function handleFoundChip(dbRow, next) {
  if (dbRow.allowedversion === null) {
    notFound(next);
  }
  else {
    var allowedVersion = getVersionFromDb(dbRow.allowedVersion)
      .then(
      (results) => {
        if (results.md5 !== dbRow.lastversion && results.data !== null) {
          res.end(results.data, 'binary');
        }
      },
      () => {
        notFound(next);
      })
  }
}


function notFound(next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
}

function handleRequest(req, res, next) {
  if (connected) {
    var current_md5 = req.headers["x-esp8266-sketch-md5"];
    var chipid = req.params["chip_id"];
    var checkChipInDbResult = checkChipInDb(current_md5, chipid)
      .then((results) => {
        handleFoundChip(results, next);
      },
      () => {
        notFound(next);
      }
      )
  }
  else {
    notFound(next);
  }
}

router.get('/getupdate/:chip_id/:filename.:ext', handleRequest)

module.exports = router;
