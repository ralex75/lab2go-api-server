const db = require("../models/index");
const global=require("./global")
const {sendMail}=require("./mailer")


const discard=async(request)=>{
    
    request.status="DISCARDED"
    request.save()
    return {"msg":"Grazie, la richiesta è stata RIFIUTATA.","mailbody":""}
    
}

const accept=async (request)=>{
    
    const {readTemplate,replaceInTemplate}=require("./utils")
   
    let user=await db.users.findOne({ where: {email:request.userEmail},raw:true})
    
    if(!user){
        const code = request.plesso_mec_code
        const {name,surname,email}=JSON.parse(request.user_json_data) 
        const {createAccount} = require("./auth.js")
        user=await createAccount({"email":email,"password":code,"name":name,"surname":surname})
    }


    user["password"]=request.plesso_mec_code
    user["LINK_REQUEST_STATUS"]=global.LAB2GO_BASE_URL.DEV

    let mergedUserData={...user,...JSON.parse(request.user_json_data)}

    let txt=readTemplate("new_request.txt")
    txt=replaceInTemplate(txt,JSON.parse(request.school_json_data))
    txt=replaceInTemplate(txt,mergedUserData)
    
    sendMail(global.mail.NO_REPLY,[user.email,user.emailAlt],"Nuova richiesta di partecipazione",txt,global.mail.LAB2GO_MAIL)

    request.status='SUBMITTED'
    request.save()

    //return "Grazie, la richiesta è stata APPROVATA!"

    return {"msg":"Grazie, la richiesta è stata APPROVATA!","mailbody":txt}

}


const buildAskConfirm=async (request)=>{

    const moment=require("moment")
    const {readTemplate,replaceInTemplate}=require("../api/utils")
    let {requestToken,school_json_data,user_json_data,createdAt}=request
    let txt=readTemplate("pending_request.txt")
    txt=replaceInTemplate(txt,JSON.parse(school_json_data))
    txt=replaceInTemplate(txt,JSON.parse(user_json_data))
    let LINK_ACCEPT=`${global.LAB2GO_BASE_URL.PROD}/api/requests/confirm?tk=${requestToken}&status=accept`
    let LINK_DISCARD=`${global.LAB2GO_BASE_URL.PROD}/api/requests/confirm?tk=${requestToken}&status=discard`
    
    //rimuove eventuali multipli backslash nell'URL
    LINK_ACCEPT=LINK_ACCEPT.replace(/([^:]\/)\/+/g, "$1")
    LINK_DISCARD=LINK_DISCARD.replace(/([^:]\/)\/+/g, "$1")

    LINK_ACCEPT=`<a href="${LINK_ACCEPT}">accettare</a>`
    LINK_DISCARD=`<a href="${LINK_DISCARD}">scartare</a>`
    let TIME=moment(createdAt).format("HH:mm")
    let DATE=moment(createdAt).format("DD-MM-YYYY")
    txt=replaceInTemplate(txt,{LINK_ACCEPT,LINK_DISCARD,DATE,TIME})
    
    return txt

}


module.exports={accept,discard,buildAskConfirm}
