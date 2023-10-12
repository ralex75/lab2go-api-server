const {Router}=require("express")
const db = require("../models/index");

const router=Router()

const writeSettings=async (settings)=>{
    //const t = await db.sequelize.transaction();
    let error=""
    
    try{
       
        await db.setting.destroy({where:{} })
        Object.keys(settings).forEach(async k=>{
            
            await db.setting.create({'value':settings[k],'key':k})
        })
        
        //await t.commit()
    }
    catch(exc){
        console.log("IN err")
        console.log(exc.message)
        error=exc.message
        //await t.rollback();
    }

    return error
}

router.get("/",async (req,res)=>{
    let settings={"allow_single_finalize":"1","allow_new_edit_request_date":"2023-09-30","allow_edit_school_untilAt":"2023-10-15"}
    let result=await db.setting.findAll({raw:true})
    result.forEach(r => {
        settings[r.key]=r.value
    });

    let error=await writeSettings(settings)
    if(error){
        return res.sendStatus(500)
    }
    res.json(settings)
})

router.put("/",async (req,res)=>{
    let {settings}=req.body

    
    let error=await writeSettings(settings)
    if(error){
        return res.sendStatus(500)
    }
    
    
    res.json(settings)
})

module.exports=router