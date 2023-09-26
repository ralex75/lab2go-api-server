module.exports = (sequelize, Sequelize) => {
      const Referent = sequelize.define("referent", {
           name:{type:Sequelize.STRING},
           email:{type:Sequelize.STRING},
           entity:{type:Sequelize.STRING},
           disciplina:{type:Sequelize.STRING},
           status:{type:Sequelize.STRING,defaultValue:'ENABLED'},
      },{ timestamps: true })
      return Referent;
    };