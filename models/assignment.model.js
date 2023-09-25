
module.exports = (sequelize, Sequelize) => {
    const Assignment = sequelize.define("assignment", {
          schoolId: { type: Sequelize.INTEGER },
          tutorId: { type: Sequelize.INTEGER },
          requestId: { type: Sequelize.INTEGER },
         disciplina: { type:Sequelize.STRING },
    },{ timestamps: true })
    return Assignment;
  };