
module.exports = (sequelize, Sequelize) => {
    const Tutor = sequelize.define("tutor", {
         name:{type:Sequelize.STRING},
         email:{type:Sequelize.STRING},
         status:{type:Sequelize.STRING,defaultValue:'ENABLED'},
    },{ timestamps: true })
    return Tutor;
  };