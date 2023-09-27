const dbConfig = require("../db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig);

//models
const user    = require("./user.model")(sequelize, Sequelize);
const request = require("./request.model")(sequelize, Sequelize);
const school  = require("./school.model")(sequelize, Sequelize);
const student  = require("./student.model")(sequelize, Sequelize);
const setting  = require("./setting.model")(sequelize, Sequelize);
const tutor  = require("./tutor.model")(sequelize, Sequelize);
const referent  = require("./referent.model")(sequelize, Sequelize);
const assignment  = require("./assignment.model")(sequelize, Sequelize);

school.hasMany(student)
school.hasMany(assignment,{onDelete: 'CASCADE'})
school.belongsTo(request,{foreignKey:'requestId'})
student.belongsTo(school,{foreignKey: 'schoolId'})
assignment.belongsTo(school,{foreignKey: 'schoolId'})
assignment.belongsTo(tutor,{foreignKey: 'tutorId'})
assignment.belongsTo(request,{foreignKey: 'requestId'})

const db = {
    Sequelize,
    sequelize,
    request,
    user,
    school,
    student,
    setting,
    tutor,
    referent,
    assignment
}


module.exports = db;