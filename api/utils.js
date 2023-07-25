const replaceInTemplate=(tpl,json_obj)=>{
    let html=tpl
    Object.keys(json_obj).forEach(k=>{
        let value=json_obj[k]
        value = (!value || value.length==0) ? "-----" : Array.isArray(value) ? value.join(",") : value
        html=html.replaceAll(`[${k}]`,value)
    })

    return html

}

const readTemplate=(fileName)=>{
    const fs =require("fs")
    const path=require("path")
    return fs.readFileSync(path.join(__dirname,`./../text_templates/${fileName}`),{"encoding":"utf-8"})
}

module.exports={readTemplate,replaceInTemplate}