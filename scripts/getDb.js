const fs = require('fs');
import conf from '../config/config';
import apiKey from './secrets/apiKey';
const axios = require('axios');

async function getDb() {
    console.log("download db");
    try {
        axios({
            url: "http://3.13.8.41:3009/getDb", 
            headers: {
                Authorization: apiKey
            },
            responseType: "stream"
        }).then((resp)=>{
            resp.data.pipe(fs.createWriteStream('./'+conf.dbName+'.db'));
            console.log("Downloaded db");
        });
    }
    catch (e) {
        console.log("error on getting user");
        console.log(e);
    }
}


getDb();