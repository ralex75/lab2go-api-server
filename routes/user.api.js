const {Router}=require("express")
const db = require("../models/index");
const { body, check, validationResult, cookie } = require('express-validator');
const { where } = require("sequelize");
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const auth=require("../api/auth");
const { sendMail } = require("../api/mailer");
require('dotenv').config()

const router=Router()


router.get("/", auth.checkAuth, async (req,res)=>{
    let {email}=req.user
    let user=await db.user.findOne({ where: {email:email},raw:true})
    res.json({user})
})

router.get("/accounts", auth.checkAuth, async (req,res)=>{
    let {email,roles}=req.user
    let users=await db.user.findAll({attributes: {exclude: ['password']},raw:true})
    res.json(users)
})

router.put("/account",auth.checkAuth,async (req,res)=>{
     //let {email,roles}=req.user
     let {email,role}=req.body
     let user=await db.user.findOne({ where: {email:email}})
     user.role=role
     user.save()
     try{
        user=await db.user.findOne({ where: {email:email},raw:true})
        res.json(user)
     }
     catch(err){
        res.statusCode(500)
     }
})

router.post("/create",async(req,res)=>{
   
    const {DuplicateUserFound}=require("../api/exceptions")
    let {email,password,name,surname,role}=req.body
    const {readTemplate,replaceInTemplate}=require("../api/utils")
    
    try{
        await auth.createAccount(req.body)
        let txt=readTemplate("user_signup.txt")
        txt=replaceInTemplate(txt,{"username":email,password,name,surname})
        sendMail("alessandro.ruggieri@roma1.infn.it",email,"Lab2Go - Creazione Account",txt)
        .catch(err=>console.log(err))
        res.json("User created")
    }
    catch(exc)
    {
        let type="generic"
        let msg="An error has occurred."
        if (exc instanceof DuplicateUserFound) {
            type="duplicated"
            msg=exc.message
        }
        return res.status(500).json({type,msg})    
    }
    
})

router.post("/login",async (req,res)=>{
    
    let {email,password}=req.body
    let user=await db.user.findOne({ where: {email:email},raw: true})
    if(!user) return res.status(401).json("User not found.")
    
    console.log(user.password)
    console.log()
    if(!bcrypt.compareSync(password,user.password)){
        return res.status(401).json({"exc":"invalid user or password."})
    }

    user={"email":user.email,"role":user.role,"name":user.name,"surname":user.surname}

    const token=jwt.sign(user,process.env.TOKEN_KEY,{"expiresIn":"1h"})
    res.cookie('access_token',token, {httpOnly:true}).status(200).json({"message":"Logged in succesfully",user})
})

router.post("/logout",(req,res)=>{
    return res
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Successfully logged out" });
})




module.exports=router