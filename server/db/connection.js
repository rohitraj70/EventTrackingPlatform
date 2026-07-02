const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ticketing",
  password: "rohitRaj4577",
  port: 5432,
});

module.exports = pool;