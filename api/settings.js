const db = require("../models/index");

const allowRequestSchoolUntilAt=async (req,res,next)=>{
  
    let setting=await db.setting.findOne({where:{"key":'allow_request_school_untilAt'},raw:true})
  
    if(new Date()>new Date(setting.value)){
        return next("Creazione nuova richiesta non consentita: limite di tempo massimo raggiunto.")
    }
  
    next()
  }
  
  const allowEditSchoolUntilAt=async (req,res,next)=>{
    
    let setting=await db.setting.findOne({where:{"key":'allow_edit_school_untilAt'},raw:true})
  
    if(new Date()>new Date(setting.value)){
        return next("Modifica dati della scuola non consentita: limite di tempo massimo raggiunto.")
    }
  
    next()
}

 module.exports={
            allowRequestSchoolUntilAt,
            allowEditSchoolUntilAt
        }
 