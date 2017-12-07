var mysql = require('mysql');

var settings = {
    setup: () => {
        var conn = mysql.createConnection({
            host: 'localhost',
            user: 'espserver',
            password: '35p53rv3r',
            database: 'espserver'
        });
        conn.connect((err) => {
            if (err) throw err
            console.log('Database is now connected...')
        });
        return conn;
    }

};
module.exports = settings;