const {Router}=require("express")
const db = require("../models/index");
const { body, check, validationResult } = require('express-validator');
const { where } = require("sequelize");


const router=Router()

router.get("/:schoolId",async (req,res)=>{
    let {schoolId}=req.params
    //let partecipationYears=await db.school.findAll({attributes:['year','id'],where:{"plesso_mec_code":plesso_code},raw:true})
    
    //let schoolId=partecipationYears[year]

    //let students=await db.students.findAll({include:{model:db.schoolStudentYear, attributes:[],where:_where}})
    let students=schoolId ? await db.student.findAll({where:{"schoolId":schoolId}}) : []

    res.json({students})
})

//add school
router.post("/store",[
    
    check('student.name',"Il nome dello studente è richiesto")
    .not().isEmpty(),
    check('student.surname',"Il cognome dello studente è richiesto")
    .not().isEmpty(),
    check('student.email',"L'indirizzo email dello studente è richiesto")
    .not().isEmpty(),
    check('student.disciplina',"La disciplina dello studente è richiesta")
    .not().isEmpty(),
    check('schoolId',"L'ID della scuola è richiesto")
    .not().isEmpty()
    
],async (req,res)=>{
   
    
    const errors = validationResult(req);
    console.log(errors)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {student,schoolId}= req.body
    
    let result={}
    let {name,surname,email,disciplina}=student
    try{ 
       
        let school=await db.school.findByPk(schoolId,{raw:true})

        if(!school) throw new Error("no school found")
        let discipline=JSON.parse(school.discipline)
        if(discipline.indexOf(disciplina)<0) throw new Error("disciplina not found")

        let student=await db.student.create({name,surname,email,disciplina,schoolId})
       
        result['value']=student
    }
    catch(exc) { 
        console.log(exc)
        result['exc']=  `Cannot add student,${exc.message}`
    }
    finally { res.status(result['exc'] ? 500 : 200).json(result) }
  
})

//delete school
router.delete("/:id", async (req,res)=>{
    const {id}= req.params
    const count = await db.student.destroy({ where: { id: id } });
    res.json(count)
})

router.post('/upload',async (req,res)=>{

    const fs=require("fs")
    const {disciplina,schoolId}=req.body
    
    
    if(!req.files || !schoolId || !disciplina){
        return res.status(500).json({
            status: false,
            msg: 'Cannot upload file, missing parameters'
        });
    }

    const file=req.files.file
   
    let currentStudents=await db.student.findAll({where:{"schoolId":schoolId},raw:true})

    

    const t = await db.sequelize.transaction() 
    
    try{
        await file.mv('./uploads/'+file.name)
        let data=fs.readFileSync(`./uploads/${file.name}`,{"encoding":'utf8'})
        let newUsers=[]
        for(let d of data.split("\n"))
        {
            let student=d.split(',')
            if(student.length!=3) {throw new Error("Invalid File Entry")}
            newUsers.push({
                name:student[0],
                surname:student[1],
                email:student[2],
                disciplina:disciplina,
                schoolId:schoolId
            })
        }

        if(newUsers.length==0){throw new Error("Invalid uploaded File")}
        
        await db.student.destroy({where:{'email':currentStudents.map(s=>s.email)}},t)

        await db.student.bulkCreate(newUsers,t)

        t.commit()
    }
    catch(exc)
    {
        t.rollback()

        return res.status(500).json({
            status: false,
            msg: exc.message,
        });
    }



    return res.json({
        status: true,
        msg: `File ${file.name} has been uploaded`
    });

})

module.exports=router