const nodeCron = require("node-cron");
const isEmpty = require("lodash/isEmpty");
const { Op } = require("sequelize");

const common = require("../common");
const db = require("../db/models");
const SolanaGithubRepos = db.SolanaGithubRepos;
const Developers = db.Developers;
const Activities = db.Activities;

let page = 1;
const pageSize = 25;

const minFilesize = 300;
const maxFilesize = 5000;
const filesizeInterval = 50;
let filesizeIndex = 300;

let searchIndex = 0;

const UpdateSearchQuery = (filename, keyword) => {
  let sizeQuery = "";
  if (filesizeIndex === minFilesize) {
    sizeQuery = ` size:<=${minFilesize}`;
  } else if (filesizeIndex > maxFilesize) {
    sizeQuery = ` size:>=${maxFilesize}`;
  } else {
    sizeQuery = ` size:${filesizeIndex - filesizeInterval}..${filesizeIndex}`;
  }

  return keyword + sizeQuery + ` filename:${filename}`;
};

const UpdateGithubRepos = async (
  page,
  pageSize,
  ecosystem,
  fileName,
  keyword,
  typeMap
) => {
  const searchKey = UpdateSearchQuery(fileName, keyword);
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
              ecosystem: ecosystem,
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
    if (typeMap) {
      let repoTypeData = [];
      bulkData.map((repo) => {
        repoTypeData.push({
          repoId: repo.repoId,
          type: typeMap[keyword],
        });
      });
      await RepoTypes.bulkCreate(repoTypeData, {
        fields: ["repoId", "type"],
        ignoreDuplicates: true,
      });
    }
  }
  return data;
};

exports.findRepos = async (
  ecosystem,
  searchFileNamesOrder,
  searchKeyWordOrder,
  typeMap
) => {
  try {
    const data = await UpdateGithubRepos(
      page,
      pageSize,
      ecosystem,
      searchFileNamesOrder[searchIndex],
      searchKeyWordOrder[searchIndex],
      typeMap
    );
    if (!data || data.items.length === 0) {
      page = 1;
      if (filesizeIndex > maxFilesize) {
        filesizeIndex = minFilesize;
        if (searchIndex === searchFileNamesOrder.length - 1) {
          console.log(
            `SolanaGithubRepos table was updated successfully with ${ecosystem}!`
          );
          return;
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
        if (searchIndex === searchFileNamesOrder.length - 1) {
          console.log(
            `SolanaGithubRepos table was updated but you missed some ${ecosystem} repos because of 1000 limit`
          );
          return;
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
        if (searchIndex === searchFileNamesOrder.length - 1) {
          console.log(
            `SolanaGithubRepos table was updated but you missed some ${ecosystem} repos.`
          );
          return;
        } else {
          searchIndex += 1;
        }
      } else {
        filesizeIndex += filesizeInterval;
      }
    }
  }
};

// Developers Cron Parameters
let repoPage = 0;
const repoPageSize = 14;

exports.fetchDevelopers = async (ecosystem) => {
  if (repoPage === 0) {
    // Comment to keep old Activities Data.
    // const oneYearAgo = new Date();
    // oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    // const referenceTime = parseInt(oneYearAgo.getTime() / 1000);
    // try {
    //   const response = await Activities.destroy({
    //     where: {
    //       date: {
    //         [Op.lt]: referenceTime,
    //       },
    //     },
    //     truncate: false,
    //   });
    //   console.log(
    //     `${response} items of Activities table were deleted successfully!`
    //   );
    // } catch (err) {
    //   console.log(err);
    // }
    repoPage++;
    return;
  }
  const currentTime = parseInt(new Date().getTime() / 1000);
  const week = 3600 * 24 * 7;
  const referenceTime = currentTime - week * 15;
  const offset = (repoPage - 1) * repoPageSize;
  const limit = repoPageSize;
  const repos = await SolanaGithubRepos.findAll({
    where: { ecosystem: ecosystem },
    offset,
    limit,
  });
  if (repos && repos.length) {
    repoPage += 1;
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
        // Comment because issue happens by relationships between SolanaGithubRepos and Activities modals
        // const response = await SolanaGithubRepos.destroy({
        //   where: {
        //     repoId,
        //   },
        //   truncate: false,
        // });
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

          if (commitsData.data && commitsData.data.length) {
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
    repoPage = 0;
    console.log("Developers table was updated successfully!");
    return {
      isDevelopersCron: false,
    };
  }
};
