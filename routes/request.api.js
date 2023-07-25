const {Router}=require("express")
const db = require("../models/index");
const {sendMail} = require("../api/mailer");
const global=require("../api/global")
const auth=require("../api/auth")

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
        //sendMail(global.mail.NO_REPLY,global.mail.LAB2GO_MAIL,`[lab2go] Notifica di avvenuta gestione richiesta ID:${request.id}`,msg,global.mail.LAB2GO_MAIL,global.mailext.REQACC)
        res.send(msg)
    }
    catch(exc){
        console.log(exc)
        res.sendStatus(500)
    }
})

router.post("/create",async (req,res)=>{
    const crypto = require("crypto")
    
    
    let {school,user}=req.body
   
    //recupera il token in base al codice meccanografico dell'istituto e dell'anno corrente
    let request= await db.request.findOne({attributes:['token'],raw:true, where: { school_mec_code: school.sc_tab_code,year:new Date().getFullYear()} });
    
    //se non c'è ne genera uno
    let token = request?.token || crypto.randomBytes(64).toString('hex')

    try{
        
       
        request=await db.request.create({token:token,
                                                 requestToken:crypto.randomBytes(64).toString('hex'),
                                                 school_mec_code:school.sc_tab_code,
                                                 plesso_mec_code:school.sc_tab_plesso_code,
                                                 school_json_data:JSON.stringify(school),user_json_data:JSON.stringify(user),
                                                 userEmail:user.email})
        
       
       
        try{
            
            const {buildAskConfirm}=require("../api/confirm")
            let mailBody=buildAskConfirm(request.toJSON())
            await sendMail(global.mail.NO_REPLY,global.mail.LAB2GO_MAIL,"[lab2go] Richiesta di approvazione",mailBody,global.mail.LAB2GO_MAIL,global.mailext.REQSUB)

        }
        catch(exc){
            console.log("SendAskConfirm:",exc)
        }
        res.json({request})
    }
    catch(exc)
    {
        console.log("Exc:",exc)
        return res.status(500).json({"exc":exc})
    }
    
    
})


router.put("/:rid/update",async (req,res)=>{
    let {usr_data,disci_accepted,status}=req.body

    let curreq=await db.partRequest.findOne({where:{id:req.params.rid}})
    if(!curreq){
        return res.status(404).json("Richiesta non trovata")
    }
    
    curreq.user_json_data=JSON.stringify(usr_data)
    curreq.disci_accepted= JSON.stringify(disci_accepted)
    curreq.status=status
    curreq.save()

    res.json({request:curreq})
})

router.post("/list",auth.checkAuth,async (req,res)=>{
    let {filter}=req.body
    let {email,role}=req.user
    let where={}

    if(role!='ADMIN'){
        where={"userEmail":email}
        let preq=await db.partRequest.findOne({where:where,attributes:['token'],raw:true})
        if(preq?.token)
        {
            where={"token":preq.token}
        }
    }

   
    let requests=await db.partRequest.findAll({where:where})

    res.json({requests})
})

router.get("/tk/:tk",async (req,res)=>{
    let requests=await db.partRequest.findAll({where:{token:req.params.tk}})
    res.json({requests})
})


module.exports=router