const {Router}=require("express")
const db = require("../models/index");
const {Op,QueryTypes} = require("sequelize")
const auth=require("../api/auth")

const router=Router()

router.get('/db', auth.checkAuth, (req,res)=>{
      
    const {user}=req
    
    if(!user || user.role.toUpperCase()!='ADMIN') return res.sendStatus(403)
    const path=require('path')
    res.download(path.resolve('./db/lab2go.db'))

})

router.get("/students",auth.checkAuth, async(req,res)=>{
     
    const {user}=req
    
    //controllo permessi
    if(!user || user.role.toUpperCase()!='ADMIN') return res.sendStatus(403)

    const {scid,disc}=req.query
    
    let conf = {include:db.student}
    
    if(scid>0) conf["where"] =  {"id":scid}

    let schools=await db.school.findAll(conf)
   
    const FILE_NAME='studenti.csv'

    let disciplina_wiki_map={
        "fisica":"fisica",
        "chimica":"chimica",
        "biologia animale":"biologia",
        "biologia vegetale":"botanica",
        "musei scientifici":"museiscientifici",
        "scienze della terra":"scienzedellaterra",
        "robotica":"robotica"
    }

    const fs = require('fs');

    fs.truncateSync(FILE_NAME,0)
    schools.forEach(s=>{
        s.students.forEach(student => {
            let stud={}
            stud["account.wiki"]=`${student.name.split(' ').join("").toLowerCase()}.${student.surname.split(' ').join("").toLowerCase()}`
            stud["nome_completo"]=`${student.name} ${student.surname}`
            stud["email"]=`${student.email}`
            stud["privilegi"]=`user,${disciplina_wiki_map[student.disciplina.toLowerCase()]},${s.school_mec_code}`
            //data.push(stud)
            let line=`${stud["account.wiki"]},"${stud["nome_completo"]}","${stud["email"]}","${stud["privilegi"]}"\n`
            fs.appendFileSync(FILE_NAME, line);
        });
    })

    const path=require('path')
    res.download(FILE_NAME)


})

module.exports=router