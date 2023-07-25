const path=require("path")

module.exports = {
  storage: path.join(__dirname,"/db/lab2go.db"),
  dialect: "sqlite",
  operatorsAlias:false
};


