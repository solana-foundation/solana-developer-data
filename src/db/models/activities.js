"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Activities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Activities.belongsTo(models.Developers, {
        foreignKey: "developerId",
        onDelete: "CASCADE",
      });
      Activities.belongsTo(models.SolanaGithubRepos, {
        foreignKey: "repositoryId",
        targetKey: "id",
        onDelete: "CASCADE",
      });
    }
  }
  Activities.init(
    {
      commits: DataTypes.INTEGER,
      additions: DataTypes.INTEGER,
      deletions: DataTypes.INTEGER,
      date: DataTypes.INTEGER,
      repositoryId: DataTypes.INTEGER,
      developerId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Activities",
    }
  );
  return Activities;
};
