var tedious = require('tedious');

var verifyConnection = function(callback) {
    var Connection = require('tedious').Connection;
    var config = {
        userName: global.project.connection.userName,
        password: global.project.connection.password,
        server: global.project.connection.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { encrypt: true, database: global.project.connection.databaseName }
    };
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        callback(err);            
    });
    
}
var execSQL = function(sqlStmt, callback) {
    var Connection = require('tedious').Connection;
    var config = {
        userName: global.project.connection.userName,
        password: global.project.connection.password,
        server: global.project.connection.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { encrypt: true, database: global.project.connection.databaseName }
    };
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.  
        if (err) {
            console.log("connection error: ");
            console.log(err);
        }
        else 
            executeStatement(sqlStmt);
    });

    var Request = require('tedious').Request;
    var TYPES = require('tedious').TYPES;

    function executeStatement(sqlStmt) {
        var newData = [];
        var dataSet = [];
        request = new Request(sqlStmt, function (err, rowCount) {
            if (err) {
                console.log(err);
            }
            else {
                if (rowCount < 1) {
                    callback(null, false);
                }
                else {
                    callback(null, newData);
                }
            }
        });

        request.on('row', function (row) {
            dataSet = {};
            row.forEach(function (column) {
                dataSet[column.metadata.colName] = column.value;
            });
            newData.push(dataSet);
        });
        connection.execSql(request);
    }
}

var dbFunctions = {
    execSQL,
    verifyConnection
}

module.exports = dbFunctions;