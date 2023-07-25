const express=require('express')
const app=express()
const PORT=3000 //DEFAULT LISTENING PORT
const {configureAPI} = require("./configureAPI")

configureAPI(app)

//LISTENING
app.listen(PORT,()=>{
    console.log(`Server Lab2GO API listening on port:${PORT}`)
})