const {Router}=require("express")
const db = require("../models/index");
const { body, check, validationResult } = require('express-validator');
const { where } = require("sequelize");


const router=Router()



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

        //check disciplina
        if(Object.keys(discipline).indexOf(disciplina)<0)
            throw new Error("disciplina not found")

        let student = await db.student.findOne({where:{"email":email,"schoolId":schoolId}})
        
        if(!student)
        {
            student=await db.student.create({name,surname,email,disciplina,schoolId})
        }

        student.attivo=1
        await student.save()

        result['value']=student
    }
    catch(exc) { 
        console.log(exc)
        result['exc']=  `Cannot add student,${exc.message}`
    }
    finally { res.status(result['exc'] ? 500 : 200).json(result) }
  
})

//delete studente 
//non viene eliminato dal DB ma il suo stato diventa NON attivo
router.delete("/:id", async (req,res)=>{
    const {id}= req.params
    const student = await db.student.findByPk(id);
    student.attivo=0
    student.save()
    res.json({"student":student})
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
            if(!d) continue;
            let student=d.split(',')
            if(student.length!=3) {throw new Error("Invalid File Entry:"+d)}
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