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
    
    if(role!='ADMIN'){
        where["userEmail"]=email
    }
    
    //const schools = await db.sequelize.query(`select distinct(s.id), s.name, s.section, sy.year from schools AS s,schoolStudentYears AS sy where sy.year=2023 and sy.schoolId=s.id;`,{type: QueryTypes.SELECT});
    const schools=await db.school.findAll({where:where,include: db.student})
   
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

router.get("/:schoolId/students",async (req,res)=>{
    let {schoolId}=req.params
    let students=schoolId ? await db.student.findAll({where:{"schoolId":schoolId}}) : []
    res.json({students})
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

    [
        check('name')
        .not().isEmpty()
        .withMessage("Il nome della scuola è richiesto")
        .isLength({ min: 5 })
        .withMessage("Il nome della scuola deve essere di almeno 5 caratteri"),
        check('address',"L'indirizzo della scuola è richiesto")
        .not().isEmpty()
        .isLength({ min: 5 })
        .withMessage("L'indirizzo della scuola deve essere di almeno 5 caratteri"),
     
    ]
    , async (req,res)=>{
   
    const errors = validationResult(req);
    console.log(errors)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const school=req.body
    const updateRows=await db.schools.update({name:school.name,address:school.address,section:school.section},{where:{id:req.params.id}})
    res.json(updateRows)
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