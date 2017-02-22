module.exports = {
    options : {
        sqlOutputDir: "c:/wutemp/sql",
        sqlFileMaxInserts: 10000
    },
    dataService : { 
        url: "http://localhost:8081" ,
        token: ""
    },
    database : {
        serverName: '192.168.0.17',
        instanceName: '',
        databaseName: 'HomeDB',
        userName: 'home_user',
        password: '12345!'
    }
    
};