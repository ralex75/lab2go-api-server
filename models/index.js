const dbConfig = require("../db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig);

//models
const user    = require("./user.model")(sequelize, Sequelize);
const request = require("./request.model")(sequelize, Sequelize);
const school  = require("./school.model")(sequelize, Sequelize);
const student  = require("./student.model")(sequelize, Sequelize);
const setting  = require("./setting.model")(sequelize, Sequelize);

school.hasMany(student)
student.belongsTo(school,{foreignKey: 'schoolId'})

const db = {
    Sequelize,
    sequelize,
    request,
    user,
    school,
    student,
    setting,
}


module.exports = db;