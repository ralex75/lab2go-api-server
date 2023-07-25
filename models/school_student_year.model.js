module.exports = (sequelize, Sequelize) => {
    const SchoolStudentYear = sequelize.define("schoolStudentYear", 
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          year:{
              type:Sequelize.INTEGER,
              allowNull:false
          }
        },
        /*{
            indexes: [
              // Create a unique index composite
              {
                unique: true,
                fields: ['year','schoolId','studentId']
              }
            ]
        }*/
        {
          uniqueKeys: {
            actions_unique: {
              customIndex: true,
              fields: ['year','schoolId','studentId']
            }
          }
        }
    )
    return SchoolStudentYear;
  };