var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = require('electron').ipcRenderer;

function execSQL(sqlStmt, callback) {
    var Connection = require('tedious').Connection;
    var config = {
        userName: global.userName,
        password: global.password,
        server: global.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { encrypt: true, database: global.databaseName }
    };
    var connection = new Connection(config);
    connection.on('connect', function (err) {
        // If no error, then good to proceed.  
        console.log(err);
        console.log('connected');
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

        request.on('row', function (columns) {
            dataSet = [];
            columns.forEach(function (column) {
                dataSet.push({
                    name: column.metadata.colName,
                    value: column.value
                });
            });
            newData.push(dataSet);
        });
        connection.execSql(request);
    }
}

app.on('ready', _ => {
    global.fnExecSQL = execSQL;
    global.serverName = '127.0.0.1';
    global.databaseName = 'AdventureWorks2014';
    global.userName = 'sa';
    global.password = "LongLive1";
    
    var mainWindow = new BrowserWindow({
        width: 1200,
        height: 800
    });
    mainWindow.loadURL('file://' + __dirname + '/../dist/index.html');
});