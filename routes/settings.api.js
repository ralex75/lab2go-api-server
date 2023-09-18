const {Router}=require("express")
const db = require("../models/index");

const { where } = require("sequelize");


const router=Router()

router.get("/",async (req,res)=>{
    let settings={}
    let result=await db.setting.findAll({raw:true})
    result.forEach(r => {
        settings[r.key]=r.value
    });
    res.json(settings)
})

module.exports=router