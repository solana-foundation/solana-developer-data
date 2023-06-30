const nodeCron = require("node-cron");
const isEmpty = require("lodash/isEmpty");
const { Op } = require("sequelize");

const common = require("../common");
const db = require("../db/models");
const SolanaGithubRepos = db.SolanaGithubRepos;
const RepoTypes = db.RepoTypes;
const Developers = db.Developers;
const Activities = db.Activities;

let isEnabledCron = true;
let isDevelopersCron = false;
let page = 1;
const pageSize = 25;

const minFilesize = 300;
const maxFilesize = 5000;
const filesizeInterval = 50;
let filesizeIndex = 300;

let searchIndex = 0;

let SEARCHFILENAMESORDER = [
  "package.json",
  "package.json",
  "mod.go",
  "Cargo.toml",
  "Cargo.toml",
  "package.json",
  "package.json",
  "package.json",
  "*.csproj",
];

let SEARCHKEYWORDORDER = [
  common.constant.ANCHOR_WEB3_KEY_WORD,
  common.constant.ANCHOR_WEB3_CORAL_KEY_WORD,
  common.constant.GO_KEY_WORD,
  common.constant.NATIVE_KEY_WORD,
  common.constant.ANCHOR_KEY_WORD,
  common.constant.METAPLEX_KEY_WORD,
  common.constant.METAPLEX_FNDN_KEY_WORD,
  common.constant.SOLANA_WEB3_KEY_WORD,
  common.constant.DOT_NET_KEY_WORD,
];

const TYPEMAP = {
  [common.constant.SOLANA_WEB3_KEY_WORD]: common.constant.WEB3_JS_TYPE,
  [common.constant.ANCHOR_WEB3_KEY_WORD]: common.constant.ANCHOR_JS_TYPE,
  [common.constant.ANCHOR_WEB3_CORAL_KEY_WORD]: common.constant.ANCHOR_JS_TYPE,
  [common.constant.METAPLEX_KEY_WORD]: common.constant.NFT_TYPE,
  [common.constant.METAPLEX_FNDN_KEY_WORD]: common.constant.NFT_TYPE,
  [common.constant.GO_KEY_WORD]: common.constant.GO_TYPE,
  [common.constant.NATIVE_KEY_WORD]: common.constant.NATIVE_TYPE,
  [common.constant.ANCHOR_KEY_WORD]: common.constant.ANCHOR_TYPE,
  [common.constant.DOT_NET_KEY_WORD]: common.constant.DOT_NET_TYPE,
};

const UpdateSearchQuery = () => {
  let sizeQuery = "";
  if (filesizeIndex === minFilesize) {
    sizeQuery = ` size:<=${minFilesize}`;
  } else if (filesizeIndex > maxFilesize) {
    sizeQuery = ` size:>=${maxFilesize}`;
  } else {
    sizeQuery = ` size:${filesizeIndex - filesizeInterval}..${filesizeIndex}`;
  }

  let filename = SEARCHFILENAMESORDER[searchIndex];
  let keyword = SEARCHKEYWORDORDER[searchIndex];

  return keyword + sizeQuery + ` filename:${filename}`;
};

const UpdateSolanaGithubRepos = async (page, pageSize) => {
  const searchKey = UpdateSearchQuery();
  const { data } = await common.githubAPI.searchGithubRepos({
    searchKey,
    per_page: pageSize,
    page,
  });
  let newData = [];
  await Promise.all(
    data &&
      data.items.map(async (repo) => {
        const { repository } = repo;
        if (repository && repository.id && repository.name) {
          try {
            const { data } = await common.githubAPI.getRepoInfo({
              owner: repository.owner.login,
              repo: repository.name,
            });
            newData.push({
              repoId: repository.id,
              name: repository.name,
              url: repository.html_url,
              owner: repository.owner.login,
              started: parseInt(new Date(data.created_at).getTime() / 1000),
              ecosystem: "solana",
            });
          } catch (err) {
            console.log(err);
          }
        }
      })
  );
  const bulkData = newData.filter((item) => item !== undefined);
  if (bulkData && bulkData.length) {
    await SolanaGithubRepos.bulkCreate(bulkData, {
      fields: ["repoId", "name", "url", "owner", "started", "ecosystem"],
      ignoreDuplicates: true,
      returning: true,
    });
    let repoTypeData = [];
    bulkData.map((repo) => {
      repoTypeData.push({
        repoId: repo.repoId,
        type: TYPEMAP[SEARCHKEYWORDORDER[searchIndex]],
      });
    });
    await RepoTypes.bulkCreate(repoTypeData, {
      fields: ["repoId", "type"],
      ignoreDuplicates: true,
    });
  }
  return data;
};

exports.findSolanaReposCron = nodeCron.schedule("*/2 * * * *", async () => {
  if (!isEnabledCron) return;

  try {
    const data = await UpdateSolanaGithubRepos(page, pageSize);
    if (!data || data.items.length === 0) {
      page = 1;
      if (filesizeIndex > maxFilesize) {
        filesizeIndex = minFilesize;
        if (searchIndex === SEARCHFILENAMESORDER.length - 1) {
          isEnabledCron = false;
          console.log("SolanaGithubRepos table was updated successfully!");
          searchIndex = 0;
          isDevelopersCron = true;
        } else {
          searchIndex += 1;
        }
      } else {
        filesizeIndex += filesizeInterval;
      }
    } else {
      page += 1;
    }
  } catch (err) {
    console.log(err);
    if (
      err.response &&
      err.response.data.message ===
        "Only the first 1000 search results are available"
    ) {
      page = 1;
      if (filesizeIndex > maxFilesize) {
        filesizeIndex = minFilesize;
        if (searchIndex === SEARCHFILENAMESORDER.length - 1) {
          isEnabledCron = false;
          searchIndex = 0;
          console.log(
            "SolanaGithubRepos table was updated but you missed some repos because of 1000 limit"
          );
          isDevelopersCron = true;
        } else {
          searchIndex += 1;
        }
      } else {
        filesizeIndex += filesizeInterval;
      }
    } else {
      page = 1;
      if (filesizeIndex > maxFilesize) {
        filesizeIndex = minFilesize;
        if (searchIndex === SEARCHFILENAMESORDER.length - 1) {
          isEnabledCron = false;
          searchIndex = 0;
          console.log(
            "SolanaGithubRepos table was updated but you missed some repos"
          );
          isDevelopersCron = true;
        } else {
          searchIndex += 1;
        }
      } else {
        filesizeIndex += filesizeInterval;
      }
    }
  }
});

exports.enableFetchSolanaRepos = nodeCron.schedule("0 0 */5 * *", () => {
  isEnabledCron = true;
  isDevelopersCron = false;
  console.log(`Start updating Solana Data at ${new Date()}`);
});

// Developers Cron Parameters
let solanaRepoPage = 0;
const solanaRepoPageSize = 14;

exports.fetchSolanaDevelopers = nodeCron.schedule("* * * * *", async () => {
  if (!isDevelopersCron) return;
  if (solanaRepoPage === 0) {
    solanaRepoPage++;
    return;
  }
  const currentTime = parseInt(new Date().getTime() / 1000);
  const week = 3600 * 24 * 7;
  const referenceTime = currentTime - week * 15;
  const offset = (solanaRepoPage - 1) * solanaRepoPageSize;
  const limit = solanaRepoPageSize;
  const repos = await SolanaGithubRepos.findAll({
    where: { ecosystem: "solana" },
    offset,
    limit,
  });
  if (repos && repos.length) {
    solanaRepoPage += 1;
    repos.forEach(async (element) => {
      const { repoId, owner, name } = element;
      let elementData = null;
      let isRepoValid = true;
      try {
        const { data } = await common.githubAPI.getRepoContributorsActivity({
          owner,
          repo: name,
        });
        elementData = data;
      } catch {
        isRepoValid = false;
      }

      if (isRepoValid) {
        if (elementData && !isEmpty(elementData)) {
          elementData.forEach(async (contribution) => {
            const username = contribution.author.login;
            const activities = contribution.weeks.filter(
              (item) => item.c !== 0 && item.w > referenceTime
            );
            let developer = await Developers.findOne({
              where: {
                username,
              },
            });
            if (!developer) {
              try {
                const developerInfo = await common.githubAPI.getGitUserInfo({
                  username,
                });
                developer = await Developers.create({
                  username,
                  name: developerInfo.data.name,
                  gitUrl: developerInfo.data.html_url,
                  avatar: developerInfo.data.avatar_url,
                  location: developerInfo.data.location,
                  twitter: developerInfo.data.twitter_username,
                });
              } catch (err) {
                console.log(err);
              }
            }
            try {
              if (!developer) {
                developer = await Developers.findOne({
                  where: {
                    username,
                  },
                });
              }
              const bulkData = activities.map((activity) => ({
                commits: activity.c,
                additions: activity.a,
                delettioins: activity.d,
                date: activity.w,
                developerId: developer.id,
                repositoryId: element.id,
              }));
              if (bulkData && bulkData.length) {
                await Activities.bulkCreate(bulkData, {
                  fields: [
                    "commits",
                    "additions",
                    "delettioins",
                    "date",
                    "developerId",
                    "repositoryId",
                  ],
                  ignoreDuplicates: true,
                });
              }
            } catch (err) {
              console.log(err);
            }
          });
        } else {
          let commitsData = null;
          try {
            commitsData = await common.githubAPI.getGetRepoCommits({
              owner,
              repo: name,
              per_page: 1,
            });
          } catch {
            commitsData = null;
          }

          if (commitsData && commitsData.data && commitsData.data.length) {
            const commit = commitsData.data[0].commit;
            const date = parseInt(
              new Date(commit.author.date).getTime() / 1000
            );
            let developer = await Developers.findOne({
              where: {
                username: owner,
              },
            });
            if (!developer) {
              try {
                const developerInfo = await common.githubAPI.getGitUserInfo({
                  username: owner,
                });
                developer = await Developers.create({
                  username: owner,
                  name: developerInfo.data.name,
                  gitUrl: developerInfo.data.html_url,
                  avatar: developerInfo.data.avatar_url,
                  location: developerInfo.data.location,
                  twitter: developerInfo.data.twitter_username,
                });
              } catch (err) {
                console.log(err);
              }
            }
            try {
              if (!developer) {
                developer = await Developers.findOne({
                  where: {
                    username: owner,
                  },
                });
              }
              await Activities.create({
                commits: 1,
                additions: 0,
                delettioins: 0,
                date,
                developerId: developer.id,
                repositoryId: element.id,
              });
            } catch (err) {
              console.log(err);
            }
          }
        }
      }
    });
  } else {
    isDevelopersCron = false;
    solanaRepoPage = 0;
    console.log("Developers table was updated successfully!");
    return;
  }
});
