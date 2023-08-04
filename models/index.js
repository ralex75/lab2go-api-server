const dbConfig = require("../db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig);

//models
const user    = require("./user.model")(sequelize, Sequelize);
const request = require("./request.model")(sequelize, Sequelize);
const school  = require("./school.model")(sequelize, Sequelize);
const student  = require("./student.model")(sequelize, Sequelize);

school.hasMany(student,{foreignKey: 'schoolId'})
student.belongsTo(school)


const db = {
    Sequelize,
    sequelize,
    request,
    users:user,
    school,
    student
}


module.exports = db;