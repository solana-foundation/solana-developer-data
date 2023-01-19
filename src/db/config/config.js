require("dotenv").config();
const common = require("../../common");
const {
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  DB_DIALECT,
  PROD_DB_HOST,
  PROD_DB_PORT,
  PROD_DB_USERNAME,
  PROD_DB_PASSWORD,
  PROD_DB_NAME,
} = process.env;

module.exports = {
  development: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME || "solana_analytics",
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT || common.constant.DB,
  },
};
