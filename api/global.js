const LAB2GO_MAIL="info.lab2go@gmail.com"
const MASTER_MAIL="francesco.safaitehrani@roma1.infn.it"
const DEV_MAIL="alessandro.ruggieri@roma1.infn.it"
const NO_REPLY="noreply@infn.it"
const mailext={"REQSUB":"reqsub","REQACC":"reqacc","REQREF":"reqref"}
const LAB2GO_BASE_URL="https://lab2go-apps.roma1.infn.it/lab2go"

//BASE URL APP PROD
const LAB2GO_URL={
    REQUESTS:{"PROD":`${LAB2GO_BASE_URL}/richieste/`,"DEV":"http://localhost:3000"},
    ADMIN:{"PROD":`${LAB2GO_BASE_URL}/admin/`,"DEV":"http://localhost:3000"}
}

const mail={
  
    MASTER_MAIL,
    LAB2GO_MAIL,
    DEV_MAIL,
    NO_REPLY
}


module.exports={mail,mailext,LAB2GO_URL}