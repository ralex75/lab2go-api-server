/*module.exports = (sequelize, Sequelize) => {
  const Student = sequelize.define("student", {
       name: { type: Sequelize.STRING },
    surname: { type: Sequelize.STRING },
  })
  return Student;
};*/
module.exports = (sequelize, Sequelize) => {
    const Student = sequelize.define("student", {
         name: { type: Sequelize.STRING },
      surname: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
       
    },
    {
    indexes: [
      // Create a unique index on name
      {
        unique: true,
        fields: ['name','email']
      }
    ]
    })
    return Student;
  };