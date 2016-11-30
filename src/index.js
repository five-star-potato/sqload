var electron = require('electron');
var fs = require('fs');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = require('electron').ipcRenderer;

function saveOutputFile(content) {
    var btns = ['OK'];
    const {dialog} = require('electron')

    dialog.showSaveDialog(function (fileName) {
        if (fileName === undefined){
            console.log("You didn't save the file");
            return;
        }
        // fileName is a string that contains the path and filename created in the save file dialog.  
        fs.writeFile(fileName, content, function (err) {
            if(err){
                dialog.showMessageBox({ type: 'error', title:"Save Output", buttons: btns, message: "An error ocurred creating the file "+ err.message });
                return;
            }
            dialog.showMessageBox({ type: 'info', title:"Save Output", buttons: btns, message: "The file has been succesfully saved" });
        });
    }); 
}

function execSQL(sqlStmt, callback) {
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
        console.log("connection error: ");
        console.log(err);
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
    global.fnSaveOutput = saveOutputFile;
    global.project = {
        connection: {
            serverName : '127.0.0.1',
            databaseName : 'AdventureWorks2014',
            userName : 'sa',
            password : "LongLive1"
        },
        selectedTables: [],
        columnDefs: {}
    }
}
app.on('ready', _ => {
    init();
    var mainWindow = new BrowserWindow({
        width: 1400,
        height: 800
    });
    mainWindow.loadURL('file://' + __dirname + '/../dist/index.html');
});