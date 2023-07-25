const jwt=require("jsonwebtoken")
const {DuplicateUserFound}=require("./exceptions")

const checkAuth=(req,res,next)=>{
 
    let tk=req.cookies?.access_token 
   
    if(!tk){
        res.sendStatus(403)
    }
    try {
        req.user = jwt.verify(tk, process.env.TOKEN_KEY);
        next();
      } catch (exc) {
        console.log(exc)
        res.sendStatus(403);
      }
}


const createAccount=async ({email,password,name,surname})=>{
  const db = require("../models/index");
  const bcrypt=require("bcrypt")

  const user=await db.users.findOne({ where: {email:email},raw:true})

  if(user) throw new DuplicateUserFound("Cannot create, duplicate user found.")
  
  const hashedPasswd=bcrypt.hashSync(password,10).toString("hex")
  
  try{
     const user=await db.users.create({"name":name,"surname":surname,"email":email,"password":hashedPasswd})
    
     return user.toJSON()
  }
  catch(exc){
     throw exc   
  }

  
}

module.exports={checkAuth,createAccount}