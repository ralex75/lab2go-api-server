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
router.post("/",[
    check('student.name',"Il nome dello studente è richiesto")
    .not().isEmpty(),
    check('student.surname',"Il cognome dello studente è richiesto")
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
    
    const year=new Date().getUTCFullYear()
    let result={}
    let {name,surname}=student
    try{ 
       
        let student=await db.student.create({name,surname,schoolId})
        await db.schoolStudentYear.create({
            schoolId:schoolId,
            studentId:student.id,
            year:year
        })
        
        result['value']=student
    }
    catch(exc) { 
        console.log(exc)
        result['exc']= exc.message || exc?.errors[0].message || exc 
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
    const {schoolId}=req.body
    
    
    if(!req.files || !schoolId){
        return res.status(500).json({
            status: false,
            msg: 'No file uploaded'
        });
    }

    const file=req.files.file
   

    try{
        await file.mv('./uploads/'+file.name)
        let data=fs.readFileSync(`./uploads/${file.name}`,{"encoding":'utf8'})
        let newUsers=[]
        let year=new Date().getUTCFullYear()
        await db.students.destroy({where:{year:year,schoolId:schoolId}})

        for(let d of data.split("\n"))
        {
            let student=d.split(',')
            if(student.length!=2) {throw new Error("Invalid File Entry")}
            newUsers.push({
                name:student[0],
                surname:student[1],
                year:year,
                schoolId:schoolId
            })
        }

        if(newUsers.length==0){throw new Error("Invalid Uplodade File")}
        
        
        await db.students.bulkCreate(newUsers)

    }
    catch(exc)
    {
        
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