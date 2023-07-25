const dbConfig = require("../db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig);

//models
const user = require("./user.model.js")(sequelize, Sequelize);
const request=require("./request.model")(sequelize, Sequelize);


const db={
    Sequelize,
    sequelize,
    request,
    users:user
}

module.exports = db;