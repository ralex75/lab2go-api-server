const {Router}=require("express")
const db = require("../models/index");
const { body, check, validationResult } = require('express-validator');
const { where } = require("sequelize");


const router=Router()

router.get("/",async (req,res)=>{
    let tutors= await db.tutor.findAll({where:{status:'ENABLED'},raw:true})
    res.json(tutors)
})

router.post("/",async (req,res)=>{
    let tutor=req.body.tutor
    await db.tutor.create(tutor)
    res.json("tutor created")
})

router.put("/:id",async (req,res)=>{
    let nt=req.body.tutor
    let tutor=await db.tutor.findByPk(req.params.id)
    tutor.name=nt.name
    tutor.email=nt.email
    tutor.save()
    res.json("tutor updated")
})

//i tutor non vengono eliminati ma semplicemente disabilitati
router.delete("/:id",async (req,res)=>{
    let tutor=db.tutor.findByPk(id,{raw:true})
    if(tutor.email=='noreply@infn.it') return res.json("Questo tutor non può essere eliminato")
    tutor.status="DISABLED"
    res.json("tutor deleted")
})

router.get("/load",async(req,res)=>{
    const fs=require("fs")
    const path=require("path")
    let tutors=fs.readFileSync(path.join(__dirname,"./../text_templates/tutors.txt"),{ encoding: 'utf8', flag: 'r' })
    tutors=tutors.split("\n")
    tutors.forEach(t => {
        let fullname=t.split("@")[0]
        fullname=fullname.split(".")
        if(fullname.length==1) return
       
        fullname[0]=fullname[0].replace(/^./, fullname[0][0].toUpperCase())
        fullname[1]=fullname[1].replace(/^./, fullname[1][0].toUpperCase())
        fullname=fullname.join(" ")
        db.tutor.create({"name":fullname,"email":t})
        
    });

    res.json("done")
})

module.exports=router