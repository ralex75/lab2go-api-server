module.exports = (sequelize, Sequelize) => {
    const Setting = sequelize.define("setting", {
        key: { type: Sequelize.STRING,allowNull:false,primaryKey:true },
         value: { type: Sequelize.STRING,allowNull:false },
    })
    return Setting;
  };