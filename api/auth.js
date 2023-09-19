const jwt=require("jsonwebtoken")
const {DuplicateUserFound}=require("./exceptions")
const db = require("../models/index");

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
 
  

  const user=await db.user.findOne({ where: {email:email},raw:true})

  if(user) throw new DuplicateUserFound("Cannot create, duplicate user found.")
  
  const hashedPasswd=hashPassword(password)
  
  try{
     const user=await db.user.create({"name":name,"surname":surname,"email":email,"password":hashedPasswd})
    
     return user
     //return user.toJSON()
  }
  catch(exc){
     throw exc   
  }

  
}

const hashPassword=(password)=>{
    const bcrypt=require("bcrypt")
    return bcrypt.hashSync(password,10)
}



module.exports={checkAuth,
                createAccount,
                hashPassword}