"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Developers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Developers.hasMany(models.Activities, {
        foreignKey: "developerId",
      });
    }
  }
  Developers.init(
    {
      username: DataTypes.STRING,
      name: DataTypes.STRING,
      gitUrl: DataTypes.STRING,
      avatar: DataTypes.STRING,
      location: DataTypes.STRING,
      twitter: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Developers",
    }
  );
  return Developers;
};
