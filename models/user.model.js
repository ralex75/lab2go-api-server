
module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
          email: { type: Sequelize.STRING,primaryKey:true },
         password:{type:Sequelize.STRING},
         role: { type: Sequelize.STRING,defaultValue:"DOCENTE"},
         name:{type:Sequelize.STRING},
         surname:{type:Sequelize.STRING},
    },{ timestamps: true })
    return User;
  };