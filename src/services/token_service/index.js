const helper = global.helper;
const config = helper.config;
const utilites = require('../../utilities');
const safePromise = utilites.safePromise;
const Redis = require('redis');
const redisClient = Redis.createClient();
redisClient.on('error', function (err) {
    console.log("Connection issue =>> ", err);
})
const CACHE_EXPIRY = 20
const logger = utilites.logger;
const knex = require('../../../models/knex').knexConn;
const log = logger('welcome.service');



function generateToken() {
    return new Promise(async (resolve, reject) => {
        redisClient.keys('_*', async function (err, keys) {
            if (err) {
                return reject(err)
            }
            if (keys.length === 5) {
                return reject("please wait token is in queue")
            }
            const [err, response] = await safePromise(knex.select("token").from("token_table"))
            if (err) {
                return reject("error in connecting database")
            }
            let lasttoken = response[response.length - 1].token
            var count = 0
            count = +lasttoken + 1
            const token = count
            const [insearteErr, success] = await safePromise(knex.insert({
                token: token,
                status: 1
            }).table('token_table'))
            if (insearteErr) {
                return reject("Error inserting data into database")
            }
            let [responseErr, key] = await safePromise(knex('token_table')
                .where('token', token)
                .select('id'));
            if (responseErr) {
                return reject("error in fetching data ")
            }
            key = "_" + key[0].id
            redisClient.set(key, token, 'EX', CACHE_EXPIRY, function (err) {
                if (err) {
                    console.log('Error setting cache', err);
                }
            });
            resolve(token);
        });
    })
}

function consumeToken(token) {
    return new Promise(async function (resolve, reject) {
        let [responseErr, response] = await safePromise(knex('token_table')
            .where('token', token)
            .select(['id', 'status']))
        if (response.length === 0 || responseErr) {
            return reject("please insert the valid token")
        }
        const final_Status = response[0].status
        key = "_" + response[0].id
        if (!final_Status) {
            return reject("token already consumed")
        }
        let [respErr, resp] = await safePromise(knex('token_table')
            .where('token', token - 1)
            .select(['id', 'status']))
        const prekey = "_" + resp[0].id
        redisClient.get(prekey, function (err, precachedData) {
            if (precachedData) {
                return reject("please wait sometime your token is in queue")
            }
            redisClient.get(key, async function (err, cachedData) {
                if (err) {
                    console.log('Error getting cache falling back to database query');
                }
                if (!cachedData) {
                    return reject("token expired")
                }
                const [Err, response] = await safePromise(knex('token_table')
                    .where('token', token)
                    .update({
                        status: 0
                    }))
                if (Err) {
                    return reject("error in updating ")
                }
                redisClient.del(key, function (err) {
                    if (err) {
                        return reject(err);
                    }
                });
                resolve("token consumed")
            })
        })

    })
}

module.exports = {
    generateToken,
    consumeToken
}