var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Promise = require('promise');

var connection;
router["setConnection"] = (appConnection) => {
  console.log("getupdate:setconnection");
  connection = appConnection;
};

function checkChipInDb(current_md5, chipid) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM espchips WHERE chip_id = ' + connection.escape(chipid), function (error, results, fields) {
      if (error) {
        console.log("Query error");
        reject('Not Found');
      }
      else {
        if (results.length > 0) {
          var dt = Date.now();
          updateChipData(current_md5, chipid, dt);
          results[0]["lastversion"] = current_md5;
          results[0]["lastrequest"] = dt;
          resolve(results[0]);
        }
        else {
          console.log("Chip not in DB");
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
    var qry1 = connection.query('SELECT * FROM firmwareversions WHERE md5 = ?', [md5], function (error, results, fields) {
      if (error) {
        console.log("Query error");
        reject('Not Found');
      }
      else {
        if (results.length > 0) {
          resolve(results[0]);
        }
        else {
          console.log("Firmware not in DB");
          insertNewFirmwareVersion(md5);
          reject('Not Found');
        }
      }
    });
    console.log(qry1.sql);
  });
}

function insertNewFirmwareVersion(md5) {
  console.log("insertNewFirmwareVersion");
  var qry1 = connection.query('INSERT INTO firmwareversions(md5) values (?)', [md5], function (error, results, fields) {
  });
}

function insertNewChip(chipid, current_md5) {
  console.log("insertNewChip", chipid, current_md5);
  getVersionFromDb(current_md5)
    .then((result) => {
      var qry2 = connection.query('INSERT INTO espchips(chip_id, lastversion, lastrequest) values (?, ?, ?)', [chipid, result.md5, Date.now()], function (error, results, fields) {
      });
    })
}


function updateChipData(md5, chip_id, datestamp) {
  var qry = connection.query('update espchips set lastversion = ?, lastrequest=? where chip_id = ?', [md5, datestamp, chip_id], function (error, results, fields) {
  });

}


function handleFoundChip(dbRow, res, next) {
  if (dbRow.allowedversion === null) {
    notFound(next);
  }
  else {
    var allowedVersion = getVersionFromDb(dbRow.allowedversion)
      .then(
      (results) => {
        console.log("allowedVersion", results.md5, dbRow.lastversion);
        if (results.md5 !== dbRow.lastversion && results.data !== null) {
          res.status(200).send(results.data);
          console.log("Done sending");
        }
        else {
          console.log("Chip up-to-date");
          notFound(next);
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
  if (connection.state !== "disconnected" && connection.state !== "protocol_error") {
    var current_md5 = req.headers["x-esp8266-sketch-md5"];
    var chipid = req.params["chip_id"];
    var checkChipInDbResult = checkChipInDb(current_md5, chipid)
      .then((results) => {
        handleFoundChip(results, res, next);
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
