
module.exports = (sequelize, Sequelize) => {
    const School = sequelize.define("school", {
          id: { type: Sequelize.INTEGER,autoIncrement: true, primaryKey:true },
          year:{type:Sequelize.TEXT,defaultValue:new Date().getFullYear()},
          school_mec_code:{ type: Sequelize.STRING,allowNull:false },
          plesso_mec_code:{ type: Sequelize.STRING,allowNull:false },
          school_json_data: { type: Sequelize.STRING,allowNull:false },
          user_json_data: { type: Sequelize.STRING,allowNull:false },
          discipline:{type:Sequelize.STRING},
          token:{type: Sequelize.STRING,allowNull:false },
          userEmail:{type:Sequelize.STRING,allowNull:false},
          tutors:{type:Sequelize.STRING,allowNull:true}
      },
      {
      indexes: [
        {
            unique: true,
            fields: ['year', 'plesso_mec_code']
        }
    ]})
  
    return School;
};