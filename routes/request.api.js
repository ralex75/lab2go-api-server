const {Router}=require("express")
const db = require("../models/index");
const {Op,QueryTypes} = require("sequelize")
const {sendMail} = require("../api/mailer");
const global=require("../api/global")
const auth=require("../api/auth")
const settings=require("../api/settings")

const router=Router()


router.get("/confirm",async (req,res)=>{
    let {tk,status}=req.query
    if(!tk || !status) return res.sendStatus(403)
    if(status!='discard' && status!='accept') return res.sendStatus(403)
    const {accept,discard}=require("../api/confirm")
    const actions= {"accept":accept,"discard":discard}
    let request=await db.request.findOne({where:{requestToken:tk}})
    if(!request || request.status!='PENDING') return res.sendStatus(403)
        
    try{
        let {msg,mailbody}=await actions[status](request)
        let ext = status=='accept' ? global.mailext.REQACC : global.mailext.REQREF
      
        let environment = process.env.NODE_ENV

        //in base all'ambiente di sviluppo genera gli indirizzi
        if(environment=='PROD')
        {
            sendMail(global.mail.NO_REPLY,global.mail.LAB2GO_MAIL,`[lab2go] Notifica di avvenuta gestione richiesta ID:${request.id}`,msg,global.mail.LAB2GO_MAIL,ext)
        }
        else{
            sendMail(global.mail.NO_REPLY,global.mail.DEV_MAIL,`[lab2go] Notifica di avvenuta gestione richiesta ID:${request.id}`,msg,global.mail.LAB2GO_MAIL)
        }
        
         res.send(msg)
    }
    catch(exc){
        console.log(exc)
        res.sendStatus(500)
    }
})

//@creazione di una nuova richiesta
//auth.allowRequestSchoolUntilAt => middleware per il controllo se il limite di tempo per la richiesta è stato raggiunto
router.post("/create", settings.allowRequestSchoolUntilAt, async (req,res)=>{
    const crypto = require("crypto")
        
    let {school,user}=req.body
   
    //recupera il token in base al codice meccanografico dell'istituto e dell'anno corrente
    let request= await db.request.findOne({attributes:['token'],raw:true, where: { school_mec_code: school.sc_tab_code,year:new Date().getFullYear()} });
    

    try{
        
       
    
        //se non c'è ne genera uno
        let token = request?.token || crypto.randomBytes(64).toString('hex')

       
        request=await db.request.create({token:token,
                                         requestToken:crypto.randomBytes(64).toString('hex'),
                                         school_mec_code:school.sc_tab_code,
                                         plesso_mec_code:school.sc_tab_plesso_code,
                                         school_json_data:JSON.stringify(school),user_json_data:JSON.stringify(user),
                                         userEmail:user.email})
        
       
       
        try{
            
            const {buildAskConfirm}=require("../api/confirm")
            let mailBody=await buildAskConfirm(request.toJSON())
            
            let environment = process.env.NODE_ENV

            if(environment=='PROD')
            {
                sendMail(global.mail.NO_REPLY,global.mail.LAB2GO_MAIL,`[lab2go] Richiesta di approvazione ID:${request.id}`,mailBody,global.mail.LAB2GO_MAIL,global.mailext.REQSUB)
            }
            else{
                sendMail(global.mail.NO_REPLY,global.mail.DEV_MAIL,`[lab2go] Richiesta di approvazione ID:${request.id}`,mailBody,global.mail.DEV_MAIL,global.mailext.REQSUB)
            }
  

        }
        catch(exc){
            console.log("SendAskConfirm:",exc)
        }
        res.json({request})
    }
    catch(err)
    {
        console.log(err)
        return res.status(500).json(err.message)
    }
    
    
})

router.put("/commit",async(req,res)=>{
    const { Transaction } = require('sequelize');
    const {readTemplate,replaceInTemplate}=require("./utils")
    

    const t = await db.sequelize.transaction({isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED});
    let error=""
    try{
        
        let requests=await db.request.findAll({where:{[Op.or]:[{'status':'ACCEPTED_INFN'},{'status':'ACCEPTED_USAP'}]},transaction:t})
        
        if(!requests.length) {throw new Error("Nothing to finalize")}
      
        requests.forEach(async (r) => {
            let school={
                "year":r.year,
                "school_mec_code":r.school_mec_code,
                "plesso_mec_code":r.plesso_mec_code,
                "user_json_data":r.user_json_data,
                "school_json_data":r.school_json_data,
                "discipline":r.disci_accepted,
                "token":r.token,
                "userEmail":r.userEmail,
            }
  
            school=await db.school.create(school,{ transaction: t })

            let discipline=JSON.parse(r.disci_accepted)

            //per ogni disciplina creiamo un entry nella tabella assegnamenti
            //i tutor sono per disciplina
            Object.keys(discipline).forEach(async k=>{
            
                let assignment={
                    schoolId: school.id,
                    tutorId: parseInt(discipline[k]),
                    requestId: r.id,
                    disciplina: k,
                }

                await db.assignment.create(assignment,{ transaction: t })

                let referents=await db.referent.findAll({where:{"disciplina":assignment.disciplina},raw:true})
                let status=r.status
                referents=referents.filter(r=>r.entity.indexOf(status)>-1)

                //invia mail
                let tpl=readTemplate(`acc_${referents[0].entity}.txt`.toLowerCase())
                
            })

            
        });

       

        await db.request.update({status:db.sequelize.literal("status || '_COMMIT'") },{
            where:{ [Op.or]:[ {'status':"ACCEPTED_INFN"},{'status':"ACCEPTED_USAP"},{'status':"REJECTED"}] },
            transaction: t 
        })

        await t.commit();

    }
    catch(exc){
        console.log(exc.message)
        error=exc.message
        await t.rollback();
    }

    res.json({"done":!error,"exc":error})
})



router.put("/:rid/update",async (req,res)=>{
    let {usr_data,disci_accepted,status}=req.body

    let curreq=await db.request.findOne({where:{id:req.params.rid}})
    if(!curreq){
        return res.status(404).json("Richiesta non trovata")
    }
    
    curreq.user_json_data = JSON.stringify(usr_data)
    curreq.disci_accepted = JSON.stringify(disci_accepted)
    curreq.status=status
    curreq.save()

    res.json(curreq)
})

router.post("/list",auth.checkAuth,async (req,res)=>{
   
    let {filter}=req.body
    let {email,role}=req.user
    let where={"status":{ [Op.notLike]:'%COMMIT' }}
   

    if(role!='ADMIN' && role!='COORDINATORE'){
        where={"userEmail":email}
        let preq=await db.request.findOne({where:where,attributes:['token'],raw:true})
        if(preq?.token)
        {
            where={"token":preq.token}
        }
    }

    let requests=await db.request.findAll({where:where})

    res.json({requests})
})

router.get("/tk/:tk",async (req,res)=>{
    let requests=await db.request.findAll({where:{token:req.params.tk}})
    res.json({requests})
})


module.exports=router