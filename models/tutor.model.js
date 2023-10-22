
module.exports = (sequelize, Sequelize) => {
    const Tutor = sequelize.define("tutor", {
         name:{type:Sequelize.STRING},
         email:{type:Sequelize.STRING},
         status:{type:Sequelize.STRING,defaultValue:'ENABLED'},
         allow_delete:{type:Sequelize.INTEGER,defaultValue:0}
    },{ timestamps: true })
    return Tutor;
  };