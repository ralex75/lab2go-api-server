const {Router}=require("express")
const db = require("../models/index");

const router=Router()

router.get("/",async (req,res)=>{
    let settings={}
    let result=await db.setting.findAll({raw:true})
    result.forEach(r => {
        settings[r.key]=r.value
    });
    res.json(settings)
})

router.put("/",async (req,res)=>{
    let {settings}=req.body
    
    Object.keys(settings).forEach(async k=>{
        await db.setting.update({value:settings[k]},{where:{key:k}})
    })
    
    res.json("done")
})

module.exports=router