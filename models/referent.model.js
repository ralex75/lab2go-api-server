
module.exports = (sequelize, Sequelize) => {
    const Referent = sequelize.define("referent", {
          disciplina: { type: Sequelize.STRING},
          name:{type:Sequelize.STRING},
          email:{type:Sequelize.STRING},
    },{ timestamps: true })
    return Referent;
  };