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
    const moment = require('moment')

    //controllo permessi
    if(!user || user.role.toUpperCase()!='ADMIN') return res.sendStatus(403)

    const {scid,status,sdate}=req.query
    
    let conf = {include:db.student}
    
    if(scid>0) conf["where"] =  {"id":scid}
    
    let schools=await db.school.findAll(conf,{raw:true})
   
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
        let students = s.students
        
        if(status!='ALL'){
            students=students.filter(s=>s.attivo==status)
        }
        students=students.filter(s=>moment(s.createdAt)>=moment(sdate))
        
        students.forEach(student => {

            fs.appendFileSync(FILE_NAME, mapStudentDataAlt(student));

        });
    })

    const path=require('path')
    res.download(FILE_NAME)


})

const mapStudentData=(student)=>{

    let stud={}
    stud["account.wiki"]=`${student.name.split(' ').join("").toLowerCase()}.${student.surname.split(' ').join("").toLowerCase()}`
    stud["nome_completo"]=`${student.name} ${student.surname}`
    stud["email"]=`${student.email}`
    stud["privilegi"]=`user,${disciplina_wiki_map[student.disciplina.toLowerCase()]},${s.school_mec_code}`
    return `${stud["account.wiki"]},"${stud["nome_completo"]}","${stud["email"]}","${stud["privilegi"]}"\n`
  
}

//chiesto da Franz: 08012024
const mapStudentDataAlt=(student)=>{

    let stud={}
    stud["nome"]=student.name.split(' ').join("").toLowerCase()
    stud["cognome"]=student.surname.split(' ').join("").toLowerCase()
    stud["disciplina"]=disciplina_wiki_map[student.disciplina.toLowerCase()]
    stud["mec_code"]=s.school_mec_code
    return `${Object.values(stud).join(",")}\n`
  
}

module.exports=router