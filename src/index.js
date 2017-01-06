var electron = require('electron');
var fs = require('fs');
var db = require('./db');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = require('electron').ipcRenderer;
var tmpFile = "__TMP.SQL";

function openProjectFile() {
    var btns = ['OK'];
    const {dialog} = require('electron');

    return new Promise((resolve, reject) => {
        dialog.showOpenDialog({
            filters: [
                { name: 'project', extensions: ['json'] }
            ]
        }, filenames => {
            // fileNames is an array that contains all the selected
            if (filenames === undefined) {
                reject("No file selected");
            }
            else {
                resolve(filenames[0]);
            }
        });
    })
    .then(filename => {
        return readFile(filename);
    })
    .catch(err => {
        console.log(err);
    });

    function readFile(filename) {
        return new Promise(function (resolve, reject) {
            fs.readFile(filename, 'utf-8', function (err, data) {
                if (err) {
                    console.log('rejecting');
                    reject(err);
                }
                else
                    resolve({ filename: filename, data: data });
            });
        });
    }
}

function removeSqlTemp() {
    if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
    }
}

function writeSqlToTemp(content) {
    // assume content is any array
    var fstream = fs.createWriteStream(tmpFile,{'flags': 'a'});
    fstream.on('error', err => { reject(err); });
    content.forEach(line => { 
        fstream.write(line + '\n'); }
    );
    fstream.end();
}
function saveSqlFile() {
    var btns = ['OK'];
    const {dialog} = require('electron')
    var filter = { name: 'data', extensions: ['sql'] }

    return new Promise((resolve, reject) => {
        dialog.showSaveDialog({
            filters: [
                filter
            ]
        }, filename => {
            if (filename === undefined) {
                reject("You didn't save the file");
            }
            else {
                resolve(filename);
            }
        });
    })
    .then(filename => {
        return fs.renameSync(tmpFile, filename);
    })
    .catch(err => {
        console.log(err);
    });
}

function saveProjectFile(content) {
    var btns = ['OK'];
    const {dialog} = require('electron')
    var filter = { name: 'project', extensions: ['json'] }

    return new Promise((resolve, reject) => {
        dialog.showSaveDialog({
            filters: [
                filter
            ]
        }, filename => {
            if (filename === undefined) {
                reject("You didn't save the file");
            }
            else {
                resolve(filename);
            }
        });
    })
    .then(filename => {
        return writeFile(filename, content);
    })
    .catch(err => {
        console.log(err);
    });

    function writeFile(filename, content) {
        return new Promise((resolve, reject) => {
            // fileName is a string that contains the path and filename created in the save file dialog.  
            fs.writeFile(filename, content, err => {
                if (err) {
                    dialog.showMessageBox({ type: 'error', title: "Save Output", buttons: btns, message: "An error ocurred creating the file " + err.message });
                    reject(err);
                } dialog.showMessageBox({ type: 'info', title: "Save Output", buttons: btns, message: "The file has been succesfully saved" });
                resolve("success");
            });
        });
    }
}

function newProject() {
    global.project = {
        filePath: '',
        connection: {
            /*
            serverName: '',
            databaseName: '',
            userName: '',
            password: ''
            */
            serverName: 'DELL',
            databaseName: 'AdventureWorks2014',
            userName: 'sa',
            password: "LongLive1",
            verified: false
        },
        selectedTables: [],
        columnDefs: {}
    }
}

function messageBox(title, msg) {
    const {dialog} = require('electron');
    dialog.showErrorBox(title, msg);
}
function init() {
    global.fnExecSQL = db.execSQL;
    global.fnVerifyConnection = db.verifyConnection;
    global.fnSaveProject = saveProjectFile;
    global.fnOpenProject = openProjectFile;
    global.fnWriteSqlToTemp = writeSqlToTemp;
    global.fnSaveSqlFile = saveSqlFile;
    global.fnRemoveSqlTemp = removeSqlTemp;
    global.fnNewProject = newProject;
    global.fnMsgBox = messageBox;
    newProject();
}
app.on('ready', _ => {
    init();
    var mainWindow = new BrowserWindow({
        width: 1400,
        height: 800
    });
    mainWindow.loadURL('file://' + __dirname + '/../dist/index.html');
});