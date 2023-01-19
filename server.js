const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
require("app-module-path").addPath(__dirname);

// middleware
const middleware = require("./src/middleware");
// db sync
const db = require("./src/db/models");
db.sequelize.sync();
// cron
const githubCronJob = require("./src/crons/github.cron").findSolanaReposCron;
const fetchSolanaDevelopers =
  require("./src/crons/github.cron").fetchSolanaDevelopers;
githubCronJob.start();
fetchSolanaDevelopers.start();
const enableFetchSolanaReposCronJob =
  require("./src/crons/github.cron").enableFetchSolanaRepos;
enableFetchSolanaReposCronJob.start();

const solanaResponseCacheCronJob =
  require("./src/crons/solanaResponseCache.cron").solanaResponseCache;
solanaResponseCacheCronJob.start();

const port = 8080;
const app = express();
app.use(bodyParser.json());
app.use(require("morgan")("dev"));
app.use(cors());

app.use(middleware.githubError);
app.use(middleware.postgresError);
app.use(middleware.unknownError);

const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log("App listening at //%s%s", host, port);
});
