var shell = require('shelljs');
var appConf = require('./app.conf');
var fs = require('fs');

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

function writeSqlToFile(connection, prefix, counter, content) {
    // assume content is any array
    var dt = new Date();
    var subDir = dt.toISOString().replace(/\.\d+/,'').replace(/:/g,'');
    var fileDir = `${appConf.options.sqlOutputDir}/${subDir}`;

    if (!fs.existsSync(fileDir)){
        shell.mkdir('-p', fileDir);
    }
    var sqlFile = `${prefix}_${counter}.sql`;
    var fstream = fs.createWriteStream(`${fileDir}/${sqlFile}`,{'flags': 'a'});
    fstream.on('error', err => { reject(err); });
    content.forEach(line => { 
        fstream.write(line + '\n'); }
    );
    fstream.end();

    fstream = fs.createWriteStream(`${fileDir}/run_sqlcmd.bat`,{'flags': 'a'});
    fstream.on('error', err => { reject(err); });
    fstream.write(`sqlcmd -S ${connection.serverName} -d ${connection.databaseName} -U ${connection.userName} -P ${connection.password} -i ${sqlFile}` + '\n');
    fstream.end();
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

var fileFunctions = {
    openProjectFile,
    saveProjectFile,
    writeSqlToFile
}

module.exports = fileFunctions;