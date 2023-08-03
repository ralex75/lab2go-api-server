const dbConfig = require("../db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig);

//models
const user    = require("./user.model")(sequelize, Sequelize);
const request = require("./request.model")(sequelize, Sequelize);
const school  = require("./school.model")(sequelize, Sequelize);



const db = {
    Sequelize,
    sequelize,
    request,
    users:user,
    school
}


module.exports = db;