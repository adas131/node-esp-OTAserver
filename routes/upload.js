var express = require('express');
var router = express.Router();
var md5 = require('md5');
var mysql = require('mysql');


var connection;
router["setConnection"] = (appConnection) => {
  connection = appConnection;
};

function getVersionFromDb(md5) {
  console.log("getVersionFromDb", md5);
  if (connection.state !== "connected") {
    throw new Error('Database error.');
    return;
  }
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
          reject('Not Found');
        }
      }
    });
  });
}

/* POST new firmware. */
router.post('/upload', function (req, res, next) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }

  if (connection.state !== "connected") {
    return res.status(500).send('Database error.');
  }

  // The name of the input field (i.e. "sketch") is used to retrieve the uploaded file
  var sketch = req.files.sketch;
  var sketchMD5 = md5(sketch.data);
  getVersionFromDb(sketchMD5)
    .then((result) => {
      return res.status(500).send('Duplicate sketch detected.');
    }, () => {
      var qry1 = connection.query('INSERT INTO firmwareversions(md5, data) values (?, ?)', [sketchMD5, sketch.data], function (error, results, fields) {
        if (!error) {
          return res.status(200).send('Sketch uploaded.');
        }
        else {
          console.log(error);
        }
      });
    })
});

module.exports = router;
