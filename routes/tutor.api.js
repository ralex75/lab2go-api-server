const {Router}=require("express")
const db = require("../models/index");
const { body, check, validationResult } = require('express-validator');
const { where } = require("sequelize");


const router=Router()

router.get("/",async (req,res)=>{
    let tutors= await db.tutor.findAll({raw:true})
    res.json(tutors)
})

router.post("/",async (req,res)=>{
    console.log("QUI")
    let tutor=req.body.tutor
    console.log(tutor)
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
router.delete("/:id",async (req,res)=>{
    let tutor=db.tutor.findByPk(id,{raw:true})
    if(tutor.email=='noreply@infn.it') return res.json("Questo tutor non può essere eliminato")
    await db.tutor.destroy({where:{id:req.params.id}})
    res.json("tutor deleted")
})

module.exports=router