var mysql = require('mysql');
var connection = mysql.createConnection(
    {
        host: 'localhost',
        user: 'user',
        password: 'password',
        database: 'database'
    });

exports.connection = connection;

