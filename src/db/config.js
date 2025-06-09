const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require ('pg');
require('dotenv').config();

const db  = new Kysely({
    dialect: new PostgresDialect({
        pool: new Pool({
            host    : process.env.PG_HOST,
            user    : process.env.PG_USER,
            database: process.env.PG_DATABASE,
            password: process.env.PG_PASSWORD,
            port    : process.env.PG_PORT
        })
    })
})

module.exports = db;
