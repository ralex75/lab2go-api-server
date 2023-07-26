const LAB2GO_MAIL="info.lab2go@gmail.com"
const MASTER_MAIL="francesco.safaitehrani@roma1.infn.it"
const NO_REPLY="noreply@infn.it"
const mailext={"REQSUB":"reqsub","REQACC":"reqacc"}

//BASE URL APP PROD
const LAB2GO_URL={
    REQUESTS:{"PROD":"https://lab2go-apps.roma1.infn.it/lab2go/richieste/","DEV":"localhost:3000/"},
    ADMIN:{"PROD":"https://lab2go-apps.roma1.infn.it/lab2go/admin/","DEV":"localhost:3000/"}
}

const mail={
    MASTER_MAIL,
    LAB2GO_MAIL,
    NO_REPLY
}

module.exports={mail,mailext,LAB2GO_URL}