module.exports = (sequelize, Sequelize) => {
    const Student = sequelize.define("student", {
        email: { type: Sequelize.STRING },
         name: { type: Sequelize.STRING,allowNull:false },
      surname: { type: Sequelize.STRING,allowNull:false },
        disciplina: { type: Sequelize.STRING,allowNull:false }
    })
    return Student;
  };