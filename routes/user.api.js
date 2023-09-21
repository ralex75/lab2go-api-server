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
    let user=await db.users.findOne({ where: {email:email},raw:true})
    res.json({user})
})

router.get("/list", auth.checkAuth, async (req,res)=>{
    let {email,roles}=req.user
    let users=await db.users.findAll({attributes: {exclude: ['password']},raw:true})
    res.json(users)
})



router.post("/create",async(req,res)=>{
   
    const {DuplicateUserFound}=require("../api/exceptions")
    let {user,email}=req.body
    const {readTemplate,replaceInTemplate}=require("../api/utils")
        
    try{
        if(!email){ 
            
            await auth.createAccount(user) 
        }
        else{
            let cuser=await db.users.findOne({where:{email:email}})
            cuser.name=user.name
            cuser.surname=user.surname
            cuser.email=user.email
            cuser.role=user.role
            
            if(user.password){
                console.log("passw:",user.password)
                cuser.password=auth.hashPassword(user.password)
            }
            
            cuser.save()
            
        }
        let txt=readTemplate("user_signup.txt")
        const data={"username":user.email,"name":user.name,"surname":user.surname}
        
            
        if(user.password){
            data["password"]=user.password
        }
        
        txt=replaceInTemplate(txt,data)
        sendMail("alessandro.ruggieri@roma1.infn.it",user.email,"Lab2Go - Dati Account",txt)
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
        console.log(exc)
        return res.status(500).json({type,msg,exc})    
    }
    
})

router.post("/login",async (req,res)=>{
    
    let {email,password}=req.body
    let user=await db.users.findOne({ where: {email:email},raw: true})
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


router.delete("/:email",async (req,res)=>{
    let email = req.params.email
    if(!email) return res.json("cannot delete user, invalid email")
    await db.users.destroy({where:{email:email}})
    return res.json("user deleted")
})



module.exports=router