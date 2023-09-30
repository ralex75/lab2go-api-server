const {Router}=require("express")
const db = require("../models/index");
const { body, check, validationResult } = require('express-validator');
const {Op,QueryTypes} = require("sequelize")
const auth=require("../api/auth")

const router=Router()

//school list
router.post("/",auth.checkAuth, async (req,res)=>{
    
    let {keyword,year}=req.body
    let {email,role}=req.user
    year=year || new Date().getFullYear()
    let where={"year":year}
   
    if(role!='ADMIN' && role!='COORDINATORE'){
        where["userEmail"]=email
    }
    
    const schools=await db.school.findAll({where:where,include: [{model:db.student},{model:db.assignment}]})
   
    res.json({schools})
});

//anni di partecipazione di una scuola
router.get("/:schoolId/years",async(req,res)=>{
    let {plesso_mec_code}=await db.school.findOne({where:{id:req.params.schoolId},attributes:['plesso_mec_code'],raw:true})
    let years=await db.school.findAll({order: [
        ["year", "DESC"],
      ], attributes:['year','id'],where:{"plesso_mec_code":plesso_mec_code},raw:true})
    res.json({years}) 
})

//studenti della scuola
router.get("/:schoolId/students",async (req,res)=>{
    let {schoolId}=req.params
    let students=schoolId ? await db.student.findAll({where:{"schoolId":schoolId,"attivo":1}}) : []
    res.json({students})
})

router.get("/confirm",async (req,res)=>{
    const moment = require("moment")
    let {code,year,email}=req.query
    let school=await db.school.findOne({where:{"plesso_mec_code":code,"year":year,"userEmail":email}})
    if(!school) res.sendStatus(403)
    let createdAt=school.createdAt
    let dayElapsed=moment().diff(moment(createdAt),'days')+1
    if(dayElapsed>7) res.send("Lab2GO: Spiacenti il link di conferma è scaduto.")
    school.status="CONFIRMED"
    school.save()
    res.send("Lab2GO: Grazie per aver confermato la vostra partecipazione.")
})

router.post("/search", async (req,res)=>{
    let {keyword,year}=req.body
    let query={}
    if(keyword){
        year=""
    }

    if(year)
    {
        query= {include: { model:db.schoolStudentYear, where:{ year:year }, attributes:[] }}
    }
    if(keyword)
    {
       
        //query= { where: { name: { [Op.like]: `%${keyword}%` } }}
        query= { where: {  
                            [Op.or]: [ 
                                db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('name')), 'LIKE', '%' + keyword.toLowerCase() + '%'),
                                db.sequelize.where(db.sequelize.fn('LOWER', db.sequelize.col('address')), 'LIKE', '%' + keyword.toLowerCase() + '%') 
                            ]
    
                        }
                }
    }
    let schools= await db.schools.findAll(query)
    
    //schools=schools.map(school=>{school.id,school.name,school.address,school.section,year})
    
    res.json({schools})
})

router.get("/:id", async (req,res)=>{
    const school= await db.school.findByPk(req.params.id);
    res.json({school})
});

router.get("/mcode/:code",async(req,res)=>{
    
    const https = require("https")
    const crypto = require("crypto")

    const allowLegacyRenegotiationforNodeJsOptions = {
        httpsAgent: new https.Agent({
          // for self signed you could also add
          // rejectUnauthorized: false,
          // allow legacy server
          secureOptions: crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
        }),
    };

    const axios=require("axios")
    const {code}=req.params
    const url=`https://cercalatuascuola.istruzione.it/cercalatuascuola/ricerca/risultati?rapida=${code}&tipoRicerca=RAPIDA&gidf=1`
    
    let {data}=await axios({...allowLegacyRenegotiationforNodeJsOptions,url,method:'GET'})
    let result=data.substring(data.indexOf(`<article class="sc-internal-content">`),data.indexOf("</article>"))
    
    res.json(result)
   
})

router.put("/:id",

   
     async (req,res)=>{
  

    const {tutor,...school}=req.body.school

    let sc=await db.school.findByPk(req.params.id)
    let assignments=await db.assignment.findAll({where:{schoolId:sc.id}})
    
    sc.school_json_data=JSON.stringify(school)
    sc.discipline=JSON.stringify(tutor)
    sc.save()

    
    assignments.forEach(async a=>{
        a.tutorId=tutor[a.disciplina]
        await a.save()
    })

    res.json("done")
});

//add school
router.post("/add",[
    check('name',"Il nome della scuola è richiesto")
    .not().isEmpty()
    .isLength({ min: 5 })
    .withMessage("Il nome della scuola deve essere di almeno 5 caratteri"),
    check('address',"L'indirizzo della scuola è richiesto")
    .not().isEmpty()
    .isLength({ min: 5 })
    .withMessage("L'indirizzo della scuola deve essere di almeno 5 caratteri"),
],async (req,res)=>{
   
    const errors = validationResult(req);
    console.log(errors)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {name,address,section}= req.body

    

    let result={}
    try{ result['value']=await db.schools.create({name,address,section}) }
    catch(exc) { result['exc']= exc?.errors[0].message || exc }
    finally { res.status(result['exc'] ? 500 : 200).json(result) }
  
})

//delete school
router.delete("/:id", async (req,res)=>{
    const {id}= req.params
    const count = await db.schools.destroy({ where: { id: id } });
    res.json(count)
})



module.exports=router