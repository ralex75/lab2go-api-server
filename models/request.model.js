

module.exports = (sequelize, Sequelize) => {
    const PartecipationRequest = sequelize.define("request", {
           id: { type: Sequelize.INTEGER,autoIncrement: true,primaryKey:true },
           year:{type:Sequelize.TEXT,defaultValue:new Date().getFullYear()},
          school_mec_code:{ type: Sequelize.STRING,allowNull:false },
          plesso_mec_code:{ type: Sequelize.STRING,allowNull:false },
        school_json_data: { type: Sequelize.STRING,allowNull:false },
        user_json_data: { type: Sequelize.STRING,allowNull:false },
        disci_accepted:{type:Sequelize.STRING},
        token:{type: Sequelize.STRING,allowNull:false },
        requestToken:{type: Sequelize.STRING,allowNull:false },
        status:{
            type: Sequelize.STRING,
            defaultValue: "PENDING"
          },
        userEmail:{type:Sequelize.STRING,allowNull:false}
        
    })
    return PartecipationRequest;
  };