const nodeMailer = require('nodemailer');
const {mail} = require("./global")

function sendMail(from,to,subj,body,replyTo=null,ext=""){
    
    let to_arr= Array.isArray(to) ? to : to.split(";")
   
    let transporter = nodeMailer.createTransport({
        host: 'smtp.roma1.infn.it',
        port: 25
    });


    console.log("ext:",ext)
    
  

    if(ext){
        let idx=to_arr.indexOf(mail.LAB2GO_MAIL)
        console.log("IDX:",idx)
        if(idx>-1){
            let addr=mail.LAB2GO_MAIL.split("@")
            to_arr[idx]=`${addr[0]}+${ext}@${addr[1]}`
            console.log("to:", to_arr[idx])
        }
    }

    console.log("send to:",to_arr)
    
    let mailOptions={
        from:from,
        to:to_arr,
        subject:subj,
        html:body
    }

    if(replyTo){
        mailOptions["replyTo"]=replyTo
    }


    return new Promise(function(resolve,reject){
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("error:",error)
                reject({success: false});
            } else {
                resolve({success: true})
            }
        });
    })
   
}

module.exports={sendMail};