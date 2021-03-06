var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Promise = require('promise');

var connection;
router["setConnection"] = (appConnection) => {
  console.log("getchiptypes:setconnection");
  connection = appConnection;
};

function getChipTypesFromDb() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM chiptypes', function (error, results, fields) {
      if (error) {
        console.log("Query error");
        reject('Not Found');
      }
      else {
        if (results.length > 0) {
          var tmp = [];
          results.forEach((item) => {
            tmp.push({
              id: item.id_chiptypes,
              description: item.description
            });
          })
          resolve(tmp);
        }
        else {
          console.log("None found");
          reject('Not Found');
        }
      }
    });
  });
}


function notFound(next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
}

function handleRequest(req, res, next) {
  if (connection.state !== "disconnected" && connection.state !== "protocol_error") {
    getChipTypesFromDb()
      .then((results) => {
        res.status(200).send(JSON.stringify(results, null, 4));
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

router.get('/getchiptypes/', handleRequest)

module.exports = router;
