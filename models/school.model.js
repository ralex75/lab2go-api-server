const {DataTypes} = require('@sequelize/core');

module.exports = (sequelize, Sequelize) => {
    const School = sequelize.define("school", {
            name: Sequelize.STRING, 
          address: Sequelize.STRING,
          section: Sequelize.STRING
      },
    {
    indexes: [
      // Create a unique index on name
      {
        unique: true,
        fields: ['name','section'],
        name:'unique_name_section'
      }
    ]
  })
  
    return School;
};