
module.exports = (sequelize, Sequelize) => {
    const Tutor = sequelize.define("tutor", {
         name:{type:Sequelize.STRING},
         email:{type:Sequelize.STRING},
    },{ timestamps: true })
    return Tutor;
  };