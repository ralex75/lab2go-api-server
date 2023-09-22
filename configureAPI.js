const cors=require("cors")
const express=require('express')
const db = require("./models/index.js");
const fileUpload = require('express-fileupload');
const cookieParser = require("cookie-parser");





//CORS OPTIONS
const whitelist = [ 
                    {"origin":`http://localhost:5173`}, 
                    {"origin":`http://localhost:8080`,'credentials':true},
                    {"origin":`http://webapp2.roma1.infn.it:9393`},
                    {"origin":`http://webapp2.roma1.infn.it:9292`,'credentials':true},
                    {"origin":`https://lab2gocc3m.roma1.infn.it`,'credentials':true}
                ]

let corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin:",origin)
    if (!origin || whitelist.some(w=>w.origin.indexOf(origin)!=-1)) {
       
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

const configureAPI=(app)=>{


    //EXPRESS SETTINGS
    const corsConfig = {
        origin: true,
        credentials: true,
    };
      
    app.use(cors(corsConfig));
    app.options('*', cors(corsConfig))

    app.use(express.json())
    app.use(express.urlencoded({ extended:true }))
    app.use(fileUpload({ createParentPath: true }));
    app.use(cookieParser())

    //ROUTES
    app.use('/api/schools',require("./routes/school.api"))
    app.use('/api/requests',require("./routes/request.api"))
    app.use('/api/students',require("./routes/student.api"))
    app.use('/api/user',require("./routes/user.api"))
    app.use('/api/dump',require("./routes/dump.api.js"))
    app.use('/api/settings',require("./routes/settings.api.js"))
    app.use((err,req,res,next)=>{
      res.status(500).send(err)
    })
    

}


db.sequelize.sync({alter:true})


module.exports={configureAPI}