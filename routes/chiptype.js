var express = require('express');
var router = express.Router();
var md5 = require('md5');
var mysql = require('mysql');


var connection;
router["setConnection"] = (appConnection) => {
  console.log("chiptype:setconnection");
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

router.get('/chiptype/', function (req, res, next) {
  if (connection.state !== "disconnected" && connection.state !== "protocol_error") {
    getChipTypesFromDb()
      .then((results) => {
        res.render('listchiptypes', { title: 'Edit Chips', chiptypes: results });
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

router.get('/chiptype/edit/:chipid/', function (req, res, next) {
  // if (connection.state !== "disconnected" && connection.state !== "protocol_error") {
  //   getChipTypesFromDb()
  //     .then((results) => {
  //       res.render('addchip', { title: 'Add Chip', chiptypes: results });
  //     },
  //     () => {
  //       notFound(next);
  //     }
  //     )
  // }
  // else {
  notFound(next);
  // }
})

// router.post('/chip/add/', function (req, res, next) {
//   if (connection.state === "disconnected" || connection.state === "protocol_error") {
//     console.log(connection.state);
//     return res.status(500).send('Database error.');
//   }

//   // The name of the input field (i.e. "sketch") is used to retrieve the uploaded file
//   var sketch = req.files.sketch;
//   var sketchMD5 = md5(sketch.data);
//   getVersionFromDb(sketchMD5)
//     .then((result) => {
//       return res.status(500).send('Duplicate sketch detected.');
//     }, () => {
//       var qry1 = connection.query('INSERT INTO firmwareversions(md5, data, chiptype) values (?, ?, ?)', [sketchMD5, sketch.data, req.chiptype], function (error, results, fields) {
//         if (!error) {
//           return res.status(200).send(sketchMD5);
//         }
//         else {
//           console.log(error);
//         }
//       });
//     })
// });

module.exports = router;
