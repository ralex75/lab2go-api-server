const {Router}=require("express")
const db = require("../models/index");
const {Op,QueryTypes} = require("sequelize")
const {sendMail} = require("../api/mailer");
const global=require("../api/global")
const auth=require("../api/auth")
const settings=require("../api/settings");
const { replaceInTemplate } = require("../api/utils");

const router=Router()

router.delete("/:id",async (req,res)=>{
    let id=req.params.id
    let r=await db.request.findOne({where:{id:id}})
    r.status='DISCARDED'
    r.save()
    res.json(`request id ${id} has been set with status REJECTED`)
})

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
    
    
    const t = await db.sequelize.transaction({isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED});
    let error=""
    try{
        
        let requests=await db.request.findAll({where:{[Op.or]:[{'status':'ACCEPTED_INFN'},{'status':'ACCEPTED_USAP'}]},transaction:t})
        
        
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
                "requestId":r.id
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
                    disciplina: k
                 
                }

                await db.assignment.create(assignment,{ transaction: t })

                
            })

            
        });

       
        //commit di tutto
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

    //manda notifiche
    sendConfirmSchoolNotification()
    sendRejectSchoolNotification()

    res.json({"done":!error,"exc":error})
})

const sendRejectSchoolNotification=async ()=>{

    const {readTemplate,replaceInTemplate}=require("../api/utils")

    //solo le richieste che vanno notificate es: Robotica fa da se
    const requests=await db.request.findAll({where:{sendNotific:1,status:'REJECTED_COMMIT'}})
    if(requests.length===0) return
    const fileTemplate="msg_rifiuto"
    let subject=`PCTO Lab2Go - non ammissione al progetto`
    let from=replyTo=global.mail.LAB2GO_MAIL
   
    
    requests.forEach(async req=>{
        let sd=JSON.parse(req.school_json_data)
        let ud=JSON.parse(req.user_json_data)
        
        let data={
            "SCHOOL_NAME":sd.sc_tab_plesso,"SCHOOL_MEC_CODE":sd.sc_tab_plesso_code,
            }

        //legge template
        let tpl=readTemplate(`${fileTemplate}.txt`.toLowerCase())
        let mailBody=replaceInTemplate(tpl,data)

        let to=[sd.sc_tab_email,ud.email,...ud.emailAlt]
        
        let environment=process.env.NODE_ENV.trim()

        if(environment=='PROD')
        {
            await sendMail(from,to,subject,mailBody,replyTo,null,null)
        }
        else{
            
            await sendMail(global.mail.NO_REPLY,global.mail.DEV_MAIL,subject,mailBody,global.mail.DEV_MAIL,"")
        }

        req.status+="_NOTIFIED"
        await req.save()

    })
}

const sendConfirmSchoolNotification=async ()=>{
    
    const global = require("../api/global")
    const {readTemplate,replaceInTemplate}=require("../api/utils")

    //solo le richieste che vanno notificate es: Robotica fa da se
    let requests=await db.request.findAll({where:{sendNotific:1,[Op.or]:[{'status':"ACCEPTED_INFN_COMMIT"},{'status':"ACCEPTED_USAP_COMMIT"}]}})
    if(requests.length===0) return
    let year=new Date().getFullYear()
    let schools=await db.school.findAll({where:{year:year,plesso_mec_code:{[Op.in]:requests.map(r=>r.plesso_mec_code)}},raw:true})
    
    let assignments=await db.assignment.findAll({where:{year:year},raw:true})
    let tutors=await db.tutor.findAll({raw:true})
    let referents=await db.referent.findAll({raw:true})

    let fileTemplateMap={
        "Robotica":{"contact":'attivo',"tutor":"notutor","file":"msg_attivo_notutor"},
        "Musei Scientifici":{"contact":'attivo',"tutor":"notutor","file":"msg_attivo_notutor"},
        "Chimica":{"contact":'active',"tutor":"notutor","file":"msg_attivo_notutor"},
        "Scienze della Terra":{"contact":'passivo',"tutor":"notutor","file":"msg_passivo_notutor_sdt"},
        "Biologia Vegetale":{"contact":'attivo',"tutor":"notutor","file":"msg_attivo_notutor"},
        "Biologia Animale":{"contact":'attivo',"tutor":"notutor","file":"msg_attivo_notutor"},
        "Fisica":{"contact":'passivo',"tutor":"tutor","file":"msg_fisica"},
    }


    const prepareData=async (request,assignment)=>{
       
        //recupera il referente filtrando per disciplina e per lo stato della richiesta
        let refersByDisci=referents.filter(r=> (r.disciplina.toLowerCase()==assignment.disciplina.toLowerCase()))

        let tutor=tutors.filter(t=>t.id==assignment.tutorId)[0]
    
        let ftm=fileTemplateMap[assignment.disciplina]

        let school=schools.filter(s=>s.id==assignment.schoolId)[0]
        
        let fileTemplate=ftm.file
        let referent = null

        //al momento solo fisica ha distinzione tra USAP e INFN quindi ha 2 referenti per disciplina ma in futuro non si sa...
        if(refersByDisci.length>1){
            if(assignment.disciplina.toLowerCase()=='fisica'){
                referent=refersByDisci.filter(r=>request.status.indexOf(r.entity)>-1)
                fileTemplate+=`_${referent[0].entity}`
            }
        }
        
        if(!referent){ referent=refersByDisci }

              
        return {request,school,tutor,referent,fileTemplate}

        
    }
    

    
    assignments.forEach(async assignment=>
        {   
            //le richieste sono tutte quelle che non sono ancora state notificate
            //le assegnazioni invece sono tutte
            let request=requests.filter(r=>r.id==assignment.requestId)[0]
            
            if(!request) return //equivale a continue

            let {school,tutor,referent,fileTemplate} = await prepareData(request,assignment)

            let sd=JSON.parse(school.school_json_data) //dati scuola
            let ud=JSON.parse(school.user_json_data)   //dati richiedente
        
            let environment=process.env.NODE_ENV.trim()
           
            let lnk_confirm=`${global.LAB2GO_URL.ADMIN[environment]}/api/schools/confirm?code=${school.plesso_mec_code}&year=${year}&email=${school.userEmail}`
           
            //legge template
            let tpl=readTemplate(`${fileTemplate}.txt`.toLowerCase())
            
            let data={
                    "SCHOOL_NAME":sd.sc_tab_plesso,"SCHOOL_DISCI":assignment.disciplina,
                    "REFER_DISCI":referent[0].name,"REFER_DISCI_EMAIL":`(${referent[0].email})`,
                    "LISTA_REF":referent.map(r=>`Prof. ${r.name}`).join("\n"),
                    "LISTA_REF_WITH_MAIL":referent.map(r=>`${r.name} (${r.email})`).join("\n"),
                    "TUTOR_NAME": tutor?.name,"TUTOR_EMAIL":`(${tutor?.email})`,
                    "LINK_CONFIRM":`<a href="${lnk_confirm}">Conferma</a>`
                    }
            
            
            let mailBody=replaceInTemplate(tpl,data)

            let subject=`Benvenuti a LAB2GO A.S. 2023-2024`
            let from=replyTo=global.mail.LAB2GO_MAIL
            let cc=[...referent.map(r=>r.email)]
            if(tutor && tutor.email!=global.mail.NO_REPLY)
            {
                cc.push(tutor.email)
            }
            let to=[sd.sc_tab_email,ud.email]
            to=[...to,...ud.emailAlt] //merge array
            


            if(environment=='PROD')
            {
                await sendMail(from,to,subject,mailBody,replyTo,null,cc)
            }
            else{
               
                await sendMail(global.mail.NO_REPLY,global.mail.DEV_MAIL,subject,mailBody,global.mail.DEV_MAIL,"")
            }

            request.status+="_NOTIFIED"
            request.save()

        })
        
}


router.get("/sendConfirmSchool",async (req,res)=>{
    try{
        await sendConfirmSchoolNotification()
    }
    catch(exc){
        console.log("sendConfirmSchoolNotification:",exc)
    }
    res.json("done")
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
    //let where={"status":{ [Op.notLike]:'%COMMIT' }}
    let where={}

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