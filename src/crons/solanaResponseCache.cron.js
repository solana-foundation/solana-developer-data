const { Op, QueryTypes } = require("sequelize");
const nodeCron = require("node-cron");
const responseCache = require("../common/cache").responseCache;
const db = require("../db/models");
const common = require("../common");
const SolanaGithubRepos = db.SolanaGithubRepos;
const Activities = db.Activities;
const SolanaTVLs = db.SolanaTVLs;
const SolanaUSDCs = db.SolanaUSDCs;
const StackOverflow = db.StackoverflowQuestions;
const SolanaTransactions = db.SolanaTransactions;
const SolanaNodes = db.SolanaNodes;
const ProgramsDeployed = db.ProgramsDeployed;
const RepoTypes = db.RepoTypes;

exports.solanaResponseCache = nodeCron.schedule("0 0 */6 * * *", async () => {
  const currentTime = parseInt(new Date().getTime() / 1000);
  const week = 3600 * 24 * 7;
  // SolanaContributorsActivity
  const responseSolanaContributorsActivity = await Promise.all(Array.from(
    Array(52).keys()
  ).map(async (index) => {
    const referenceTime = currentTime - week * (index + 1);
    try {
      const data = await Activities.findAndCountAll({
        include: [
          {
            model: SolanaGithubRepos,
            attributes: ["ecosystem"],
            where: {
              ecosystem: "solana",
            },
          },
        ],
        where: {
          date: {
            [Op.and]: {
              [Op.lt]: referenceTime,
              [Op.gt]: referenceTime - 4 * week,
            },
          },
        },
        distinct: true,
        col: "developerId",
        limit: 1,
      });
      return {
        xData: referenceTime + week,
        yData: data.count,
      };
    } catch (err) {
      console.log(err);
    }
  }));
  responseCache.set(
    "SolanaContributorsActivity",
    responseSolanaContributorsActivity
  );

  // SolanaContributorsStatistics
  const responseSolanaContributorsStatistics = await Promise.all(Array.from(
    Array(53).keys()
  ).map(async (index) => {
    const referenceTime = currentTime - week * index;
    try {
      const data = await Activities.findAndCountAll({
        include: [
          {
            model: SolanaGithubRepos,
            attributes: ["ecosystem"],
            where: {
              ecosystem: "solana",
            },
          },
        ],
        where: {
          date: {
            [Op.and]: {
              [Op.lt]: referenceTime,
            },
          },
        },
        distinct: true,
        col: "developerId",
        limit: 1,
      });
      return {
        xData: referenceTime,
        yData: data.count,
      };
    } catch (err) {
      console.log(err);
    }
  }));
  responseCache.set(
    "SolanaContributorsStatistics",
    responseSolanaContributorsStatistics
  );

  // SolanaReposActivity
  const responseSolanaReposActivity = await Promise.all(Array.from(Array(52).keys()).map(
    async (index) => {
      const referenceTime = currentTime - week * (index + 1);
      try {
        const data = await Activities.findAndCountAll({
          include: [
            {
              model: SolanaGithubRepos,
              attributes: ["ecosystem"],
              where: {
                ecosystem: "solana",
              },
            },
          ],
          where: {
            date: {
              [Op.and]: {
                [Op.lt]: referenceTime,
                [Op.gt]: referenceTime - 4 * week,
              },
            },
          },
          distinct: true,
          col: "repositoryId",
          limit: 1,
        });
        return {
          xData: referenceTime + week,
          yData: data.count,
        };
      } catch (err) {
        console.log(err);
      }
    }
  ));
  responseCache.set("SolanaReposActivity", responseSolanaReposActivity);

  // SolanaRecentRepoIds
  try {
    const data = await SolanaGithubRepos.findAll({
      attributes: ["repoId", "ecosystem"],
      include: [
        {
          model: Activities,
          attributes: ["date"],
          where: {
            date: {
              [Op.and]: {
                [Op.gt]: currentTime - 4 * week,
              },
            },
          },
        },
      ],
      where: {
        ecosystem: "solana",
      },
    });
    if (data) {
      const responseSolanaRecentRepoIds = data.map((item) => ({
        repoId: item.repoId,
      }));
      responseCache.set("SolanaRecentRepoIds", responseSolanaRecentRepoIds);
    }
  } catch (err) {
    console.log(err);
  }

  // SolanaReposStatistics
  const responseSolanaReposStatistics = await Promise.all(Array.from(Array(53).keys()).map(
    async (index) => {
      const referenceTime = currentTime - week * index;
      try {
        const data = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          limit: 1,
        });
        return {
          xData: referenceTime,
          yData: data.count,
        };
      } catch (err) {
        console.log(err);
      }
    }
  ));
  responseCache.set("SolanaReposStatistics", responseSolanaReposStatistics);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoReferenceTime = oneYearAgo.getTime() / 1000;

  // SolanaTVLStatistics
  try {
    const responseSolanaTVLStatistics = await SolanaTVLs.findAll({
      where: {
        timestamp: {
          [Op.gt]: oneYearAgoReferenceTime,
        },
      },
      distinct: true,
      order: [["timestamp", "DESC"]],
    });
    responseCache.set("SolanaTVLStatistics", responseSolanaTVLStatistics);
  } catch (err) {
    console.log(err);
  }

  // SolanaUSDCInsurances
  try {
    const responseSolanaUSDCInsurances = await SolanaUSDCs.findAll({
      where: {
        timestamp: {
          [Op.gt]: oneYearAgoReferenceTime,
        },
      },
      distinct: true,
      order: [["timestamp", "DESC"]],
    });

    responseCache.set("SolanaUSDCInsurances", responseSolanaUSDCInsurances);
  } catch (err) {
    console.log(err);
  }

  // SolanaTransactions
  try {
    const responseSolanaTransactions = await SolanaTransactions.findAll({
      where: {
        timestamp: {
          [Op.gt]: oneYearAgoReferenceTime,
        },
      },
      distinct: true,
      order: [["timestamp", "DESC"]],
    });

    responseCache.set("SolanaTransactions", responseSolanaTransactions);
  } catch (err) {
    console.log(err);
  }

  // SolanaNodes
  try {
    const rowsSolanaNodes = await SolanaNodes.findAll({
      where: {
        timestamp: {
          [Op.gt]: oneYearAgoReferenceTime,
        },
      },
      distinct: true,
      order: [["timestamp", "DESC"]],
    });

    const responseSolanaNodes = rowsSolanaNodes.map((item) => ({
      xData: item.timestamp,
      yData: item.counts,
    }));

    responseCache.set("SolanaNodes", responseSolanaNodes);
  } catch (err) {
    console.log(err);
  }

  // SolanaStackoverflowActivity
  const responseSolanaStackoverflowActivity = await Promise.all(Array.from(
    Array(53).keys()
  ).map(async (index) => {
    const referenceTime = currentTime - week * index;
    try {
      const data = await StackOverflow.findAndCountAll({
        where: {
          date: {
            [Op.and]: {
              [Op.lt]: referenceTime,
              [Op.gt]: referenceTime - 4 * week,
            },
          },
        },
        distinct: true,
        col: "questionId",
        limit: 1,
      });
      return {
        xData: referenceTime,
        yData: data.count,
      };
    } catch (err) {
      console.log(err);
    }
  }));
  responseCache.set(
    "SolanaStackoverflowActivity",
    responseSolanaStackoverflowActivity
  );

  // ProgramsDeployed
  const responseProgramsDeployed = await Promise.all(Array.from(Array(53).keys()).map(
    async (index) => {
      const referenceTime = currentTime - week * index;
      try {
        const data = await ProgramsDeployed.findAndCountAll({
          where: {
            date: {
              [Op.and]: {
                [Op.lt]: referenceTime,
                [Op.gt]: referenceTime - 4 * week,
              },
            },
          },
          distinct: true,
          col: "program",
          limit: 1,
        });
        return {
          xData: referenceTime,
          yData: data.count,
        };
      } catch (err) {
        console.log(err);
      }
    }
  ));
  responseCache.set("ProgramsDeployed", responseProgramsDeployed);

  // AnchorVsNative
  const responseAnchorVsNative = await Promise.all(Array.from(Array(53).keys()).map(
    async (index) => {
      const referenceTime = currentTime - week * index;
      try {
        const anchorData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                type: "anchor",
              },
            },
          ],
          limit: 1,
        });

        const nativeData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                [Op.and]: [
                  {
                    type: {
                      [Op.not]: "anchor",
                    },
                  },
                  {
                    type: "native",
                  },
                ],
              },
            },
          ],
          limit: 1,
        });

        return {
          time: referenceTime,
          anchor: anchorData.count,
          native: nativeData.count,
        };
      } catch (err) {
        console.log(err);
      }
    }
  ));
  responseCache.set("AnchorVsNative", responseAnchorVsNative);

  // NftVsOther
  const responseNftVsOther = await Promise.all(Array.from(Array(53).keys()).map(
    async (index) => {
      const referenceTime = currentTime - week * index;
      try {
        const nftData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                type: "nft",
              },
            },
          ],
          limit: 1,
        });

        const otherData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                type: {
                  [Op.not]: "nft",
                },
              },
            },
          ],
          limit: 1,
        });
        return {
          time: referenceTime,
          nft: nftData.count,
          other: otherData.count,
        };
      } catch (err) {
        console.log(err);
      }
    }
  ));
  responseCache.set("NftVsOther", responseNftVsOther);

  // JsVsGoVsSolnetVsRust
  const responseJsVsGoVsSolnetVsRust = await Promise.all(Array.from(Array(53).keys()).map(
    async (index) => {
      const referenceTime = currentTime - week * index;
      try {
        const jsData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                [Op.or]: [
                  {
                    type: "web3.js",
                  },
                  {
                    type: "anchor.js",
                  },
                ],
              },
            },
          ],
          limit: 1,
        });

        const goData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                type: "go",
              },
            },
          ],
          limit: 1,
        });

        const solnetData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
            },
            ecosystem: "solana",
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              attributes: ["type"],
              where: {
                type: "dotnet",
              },
            },
          ],
          limit: 1,
        });

        const rustData = await SolanaGithubRepos.findAndCountAll({
          where: {
            started: {
              [Op.lt]: referenceTime,
              ecosystem: "solana",
            },
          },
          distinct: true,
          include: [
            {
              model: RepoTypes,
              where: {
                [Op.or]: [
                  {
                    type: "anchor",
                  },
                  {
                    type: "native",
                  },
                ],
              },
            },
          ],
          limit: 1,
        });

        return {
          time: referenceTime,
          js: jsData.count,
          go: goData.count,
          solnet: solnetData.count,
          rust: rustData.count,
        };
      } catch (err) {
        console.log(err);
      }
    }
  ));
  responseCache.set("JsVsGoVsSolnetVsRust", responseJsVsGoVsSolnetVsRust);

  // SolanaMonthlyRetention
  let oneMonthData = [];
  let twoMonthData = [];
  let threeMonthData = [];
  const dataSolanaMonthlyRetention = await db.sequelize.query(
    common.constant.SOLANA_MONTHLY_RETENTION,
    {
      type: QueryTypes.SELECT,
    }
  );
  await dataSolanaMonthlyRetention.forEach((monthData) => {
    const currentTime = new Date();
    const time = Math.trunc(
      currentTime.setMonth(currentTime.getMonth() - (monthData.first % 12)) /
        1000
    );
    const monthOne = Math.trunc((100 * monthData.month_1) / monthData.month_0);
    const monthTwo = Math.trunc((100 * monthData.month_2) / monthData.month_0);
    const monthThree = Math.trunc(
      (100 * monthData.month_3) / monthData.month_0
    );
    if (monthOne > 0) {
      oneMonthData.push({
        xData: time,
        yData: monthOne,
      });
    }
    if (monthTwo > 0) {
      twoMonthData.push({
        xData: time,
        yData: monthTwo,
      });
    }
    if (monthThree > 0) {
      threeMonthData.push({
        xData: time,
        yData: monthThree,
      });
    }
  });
  responseCache.set("SolanaMonthlyRetention", [
    {
      monthOne: oneMonthData,
      monthTwo: twoMonthData,
      monthThree: threeMonthData,
    },
  ]);

  // SolanaWeeklyRetention
  let oneWeekData = [];
  let twoWeekData = [];
  let threeWeekData = [];
  let fourWeekData = [];
  let fiveWeekData = [];
  let sixWeekData = [];
  const dataSolanaWeeklyRetention = await db.sequelize.query(
    common.constant.SOLANA_WEEKLY_RETENTION,
    {
      type: QueryTypes.SELECT,
    }
  );
  await dataSolanaWeeklyRetention.forEach((weekData) => {
    const currentTime = new Date();
    const time = Math.trunc(
      currentTime.setDate(currentTime.getDate() - (weekData.first % 52) * 7) /
        1000
    );
    const weekOne = Math.trunc((100 * weekData.week_1) / weekData.week_0);
    const weekTwo = Math.trunc((100 * weekData.week_2) / weekData.week_0);
    const weekThree = Math.trunc((100 * weekData.week_3) / weekData.week_0);
    const weekfour = Math.trunc((100 * weekData.week_4) / weekData.week_0);
    const weekfive = Math.trunc((100 * weekData.week_5) / weekData.week_0);
    const weeksix = Math.trunc((100 * weekData.week_6) / weekData.week_0);
    if (weekOne > 0) {
      oneWeekData.push({
        xData: time,
        yData: weekOne,
      });
    }
    if (weekTwo > 0) {
      twoWeekData.push({
        xData: time,
        yData: weekTwo,
      });
    }
    if (weekThree > 0) {
      threeWeekData.push({
        xData: time,
        yData: weekThree,
      });
    }
    if (weekfour > 0) {
      fourWeekData.push({
        xData: time,
        yData: weekfour,
      });
    }
    if (weekfive > 0) {
      fiveWeekData.push({
        xData: time,
        yData: weekfive,
      });
    }
    if (weeksix > 0) {
      sixWeekData.push({
        xData: time,
        yData: weeksix,
      });
    }
  });
  responseCache.set("SolanaWeeklyRetention", [
    {
      weekOne: oneWeekData,
      weekTwo: twoWeekData,
      weekThree: threeWeekData,
      weekFour: fourWeekData,
      weekFive: fiveWeekData,
      weekSix: sixWeekData,
    },
  ]);
});
