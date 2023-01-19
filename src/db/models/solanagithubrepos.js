"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SolanaGithubRepos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SolanaGithubRepos.hasMany(models.RepoTypes, {
        foreignKey: "repoId",
        sourceKey: "repoId",
        onDelete: "CASCADE",
      });
      SolanaGithubRepos.hasMany(models.Activities, {
        foreignKey: "repositoryId",
        sourceKey: "id",
        onDelete: "CASCADE",
      });
    }
  }
  SolanaGithubRepos.init(
    {
      repoId: {
        type: DataTypes.STRING,
        unique: true,
      },
      name: DataTypes.STRING,
      url: DataTypes.STRING,
      owner: DataTypes.STRING,
      started: DataTypes.INTEGER,
      ecosystem: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "SolanaGithubRepos",
    }
  );
  return SolanaGithubRepos;
};
