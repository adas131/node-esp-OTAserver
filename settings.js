var mysql = require('mysql');

var settings = {
    app: {},
    setApp: (appToUse) => {
        app = appToUse;
        settings.setup();
    },
    setup: () => {
        app["dbConn"] = mysql.createConnection({
            host: 'localhost',
            user: 'espserver',
            password: '35p53rv3r',
            database: 'espserver'
        });
        app["dbConn"].connect((err) => {
            if (err) throw err
            console.log('Database is now connected...')
        });
    }

};
module.exports = settings;