const db = require("../models/index");

const isOutOfDate=async(key)=>{
    
    let setting=await db.setting.findOne({where:{"key":key},raw:true})
  
    return new Date()>new Date(setting.value)
        
}

const allowRequestSchoolUntilAt=async (req,res,next)=>{
  
    if(await isOutOfDate('allow_request_school_untilAt'))
    {
        return next("Creazione nuova richiesta non consentita: limite di tempo massimo raggiunto.")
    }
  
    next()
}
  
const allowEditSchoolUntilAt=async (req,res,next)=>{
   
    if(await isOutOfDate('allow_edit_school_untilAt'))
    {
        return next("Modifica dati della scuola non consentita: limite di tempo massimo raggiunto.")
    }
  
    next()
}

 module.exports={
            allowRequestSchoolUntilAt,
            allowEditSchoolUntilAt
        }
 