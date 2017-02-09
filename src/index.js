var db = require('./db');
var electron = require('electron');
var fileUtil = require('./fileUtil');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
//var ipcMain = require('electron').ipcRenderer;

function messageBox(title, msg) {
    const {dialog} = require('electron');
    dialog.showErrorBox(title, msg);
}
function init() {
    global.fnExecSQL2 = db.execSQL2;
    global.fnVerifyConnection = db.verifyConnection;
    global.fnSaveProject = fileUtil.saveProjectFile;
    global.fnOpenProject = fileUtil.openProjectFile;
    global.fnWriteSqlToFile = fileUtil.writeSqlToFile;
    global.fnMsgBox = messageBox;
}
/* this is the electron bootstrap */
app.on('ready', _ => {
    init();
    var mainWindow = new BrowserWindow({
        width: 1400,
        height: 900
    });
    /* this is the entry point of angular 2 */
    mainWindow.loadURL('file://' + __dirname + '/../dist/index.html');
});