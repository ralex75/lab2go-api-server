const db = require("../models/index");
const global=require("./global")
const {sendMail}=require("./mailer")


const discard=async(request)=>{
    
    request.status="DISCARDED"
    request.save()
    return {"msg":"Grazie, la richiesta è stata RIFIUTATA.","mailbody":""}
    
}

const accept=async (request)=>{
    const {createAccount,hashPassword} = require("./auth.js")
    const {readTemplate,replaceInTemplate}=require("./utils")
   
    let user=await db.user.findOne({ where: {email:request.userEmail}})
    
    if(!user){
        const code = request.plesso_mec_code
        const {name,surname,email}=JSON.parse(request.user_json_data) 
        
        user=await createAccount({"email":email,"password":code,"name":name,"surname":surname})
    }

    user.password=request.plesso_mec_code

    //user["LINK_REQUEST_STATUS"]=global.LAB2GO_URL.ADMIN[process.env.NODE_ENV]
    
    //merge dati utente con dati presenti nel DB e link per controllo richiesta
    let mergedUserData={...(user.toJSON()),...JSON.parse(request.user_json_data),...{"LINK_REQUEST_STATUS":global.LAB2GO_URL.ADMIN[process.env.NODE_ENV]} }

    let txt=readTemplate("new_request.txt")
    txt=replaceInTemplate(txt,JSON.parse(request.school_json_data))
    txt=replaceInTemplate(txt,mergedUserData)
   
    if(process.env.NODE_ENV=='PROD'){
        sendMail(global.mail.NO_REPLY,[user.email,user.emailAlt],"Nuova richiesta di partecipazione",txt,global.mail.LAB2GO_MAIL)
    }
    else{
        sendMail(global.mail.NO_REPLY,global.mail.DEV_MAIL,"Nuova richiesta di partecipazione",txt,global.mail.DEV_MAIL)
    }

    user.password=hashPassword(user.password)
    user.save()

    request.status='SUBMITTED'
    request.save()

    return {"msg":"Grazie, la richiesta è stata APPROVATA!","mailbody":txt}

}


const buildAskConfirm=async (request)=>{

    const moment=require("moment")
    const {readTemplate,replaceInTemplate}=require("../api/utils")
    let {requestToken,school_json_data,user_json_data,createdAt}=request
    let txt=readTemplate("pending_request.txt")
    txt=replaceInTemplate(txt,JSON.parse(school_json_data))
    txt=replaceInTemplate(txt,JSON.parse(user_json_data))

    //in base alla variabile di ambiente utilizza l'url corretto
    let LINK_ACCEPT=`${global.LAB2GO_URL.REQUESTS[process.env.NODE_ENV]}/api/requests/confirm?tk=${requestToken}&status=accept`
    let LINK_DISCARD=`${global.LAB2GO_URL.REQUESTS[process.env.NODE_ENV]}/api/requests/confirm?tk=${requestToken}&status=discard`
    
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

const buildAcceptConfirm=async (request)=>{

    const moment=require("moment")
    const {readTemplate,replaceInTemplate}=require("../api/utils")
    let {requestToken,school_json_data,user_json_data,createdAt}=request
    let fileMap={'ACCEPT_INFN_COMMIT':"acc_infn.txt",'ACCEPT_USAP_COMMIT':'acc_usap.txt'} 
    let fileName=fileMap[request.status]
    //if(!fileName) throw new Error("No file template for request status:",request.status)
    let txt=readTemplate("pending_request.txt")
    txt=replaceInTemplate(txt,JSON.parse(school_json_data))
    txt=replaceInTemplate(txt,JSON.parse(user_json_data))

    //in base alla variabile di ambiente utilizza l'url corretto
    let LINK_ACCEPT=`${global.LAB2GO_URL.REQUESTS[process.env.NODE_ENV]}/api/requests/confirm?tk=${requestToken}&status=accept`
    let LINK_DISCARD=`${global.LAB2GO_URL.REQUESTS[process.env.NODE_ENV]}/api/requests/confirm?tk=${requestToken}&status=discard`
    
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
