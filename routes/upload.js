var express = require('express');
var router = express.Router();
var md5 = require('md5');
var mysql = require('mysql');


var connection;
router["setConnection"] = (appConnection) => {
  console.log("upload:setconnection");
  connection = appConnection;
};

function getVersionFromDb(md5) {
  console.log("getVersionFromDb", md5);
  if (connection.state === "disconnected" || connection.state === "protocol_error") {
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

router.get('/upload', function (req, res, next) {
  if (connection.state !== "disconnected" && connection.state !== "protocol_error") {
    getChipTypesFromDb()
      .then((results) => {
        res.render('upload', { title: 'Upload', chiptypes: results });
      },
      () => {
        notFound(next);
      }
      )
  }
  else {
    notFound(next);
  }
})

router.post('/upload', function (req, res, next) {
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }

  if (connection.state === "disconnected" || connection.state === "protocol_error") {
    console.log(connection.state);
    return res.status(500).send('Database error.');
  }

  // The name of the input field (i.e. "sketch") is used to retrieve the uploaded file
  var sketch = req.files.sketch;
  var sketchMD5 = md5(sketch.data);
  var chiptype = req.body.chiptype;
  getVersionFromDb(sketchMD5)
    .then((result) => {
      return res.status(500).send('Duplicate sketch detected.');
    }, () => {
      var qry1 = connection.query('INSERT INTO firmwareversions(md5, data, chiptype) values (?, ?, ?)', [sketchMD5, sketch.data, chiptype], function (error, results, fields) {
        if (!error) {
          return res.status(200).send(sketchMD5);
        }
        else {
          return res.status(500).send('error');
        }
      });
    })
});

module.exports = router;
