// var randtoken = require('rand-token').suid;
const helper = global.helper;
const config = helper.config;
const utilities = require('../utilities');
//const logger = utilites.logger;
const safePromise = require('../utilities/safe-promise')
const knex = require('../../models/knex').knexConn;

async function getToken(){
    const [err ,response] = await safePromise(knex.select("token").from("token_table"))
    //console.log("response",response)
    let lasttoken = response[response.length - 1].token
    console.log("error",err)
    var count = 0
    count = +lasttoken + 1
    console.log(count)
   return count;
}

module.exports = getToken;