/** Database for lunchly */

const pg = require("pg");
require('dotenv').config();

const db = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'lunchly'
});


db.connect();

module.exports = db;
