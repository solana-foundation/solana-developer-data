"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RepoTypes extends Model {
    static associate(models) {
      RepoTypes.belongsTo(models.SolanaGithubRepos, {
        targetKey: "repoId",
        foreignKey: "repoId",
      });
    }
  }
  RepoTypes.init(
    {
      repoId: DataTypes.STRING,
      type: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "RepoTypes",
    }
  );
  RepoTypes.removeAttribute("id");
  return RepoTypes;
};
