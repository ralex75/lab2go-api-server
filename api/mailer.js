const nodeMailer = require('nodemailer');
const {mail} = require("./global")

function sendMail(from,to,subj,body,replyTo=null,ext="",cc){
    
    let to_arr= Array.isArray(to) ? to : to.split(";")
    to_arr=to_arr.filter(i=>i) //rimuove eventuali elementi nulli
   
    let transporter = nodeMailer.createTransport({
        host: 'smtp.roma1.infn.it',
        port: 25
    });


    if(ext){
        let idx=to_arr.indexOf(mail.LAB2GO_MAIL)
        if(idx>-1){
            let addr=mail.LAB2GO_MAIL.split("@")
            to_arr[idx]=`${addr[0]}+${ext}@${addr[1]}`
        }
    }

    console.log("send to:",to_arr)
    
    let mailOptions={
        from:from,
        to:to_arr,
        subject:subj,
        html:body
    }

    if(cc){
        let _cc= Array.isArray(cc) ? cc : cc.split(";")
        mailOptions['cc']= _cc.filter(i=>i) //rimuove eventuali elementi nulli
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