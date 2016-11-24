var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = require('electron').ipcRenderer;

function execSQL(sqlStmt, callback) {
    var Connection = require('tedious').Connection;
    var config = {
        userName: global.connection.userName,
        password: global.connection.password,
        server: global.connection.serverName,
        // If you are on Microsoft Azure, you need this:  
        options: { encrypt: true, database: global.connection.databaseName }
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

function init() {
    global.fnExecSQL = execSQL;
    global.connection = {
        serverName : '127.0.0.1',
        databaseName : 'AdventureWorks2014',
        userName : 'sa',
        password : "LongLive1"
    };
    global.selectedTables = [];
}
app.on('ready', _ => {
    init();
    var mainWindow = new BrowserWindow({
        width: 1200,
        height: 800
    });
    mainWindow.loadURL('file://' + __dirname + '/../dist/index.html');
});