var tedious = require('tedious');

var verifyConnection = function(connection) {
    console.log("Connection:!");
    console.log(connection);
    var Connection = tedious.Connection;
    var config = {
        userName: connection.userName,
        password: connection.password,
        server: connection.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { database: connection.databaseName, instanceName: connection.instanceName }
    };
    var connection = new Connection(config);
    return new Promise(function(resolve, reject){
        connection.on('connect', function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    
}
var execSQL2 = function(connection, sqlStmt) {
    var Request = tedious.Request;
    var TYPES = tedious.TYPES;
    var Connection = tedious.Connection;
    var config = {
        userName: connection.userName,
        password: connection.password,
        server: connection.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { database: connection.databaseName, instanceName: connection.instanceName }
    };
    var connection = new Connection(config);
    return new Promise(function(resolve, reject) {
        connection.on('connect', function (err) {
            // If no error, then good to proceed.  
            if (err) {
                console.log("connection error: ");
                reject(err);
            }
            else {
                    var newData = [];
                    var dataSet = [];
                    request = new Request(sqlStmt, function (err, rowCount) {
                        if (err) 
                            reject(err);
                        else {
                            if (rowCount < 1) 
                                reject(false);
                            else {
                                resolve(newData);
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
        });
    });
}
/*
var execSQL = function(connection, sqlStmt, callback) {
    var Connection = tedious.Connection;
    var config = {
        userName: connection.userName,
        password: connection.password,
        server: connection.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { encrypt: true, database: connection.databaseName }
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

    var Request = tedious.Request;
    var TYPES = tedious.TYPES;

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
*/
var dbFunctions = {
    execSQL2,
    verifyConnection
}

module.exports = dbFunctions;