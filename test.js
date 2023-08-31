
const call=()=>{
    return new Promise(function(resolve,reject){
        setTimeout(
            ()=>{
            return resolve(console.log("CIAO"))
        },2000)
    })
}

let wrap={"A":()=>{
       call()
    }
}

const x=async ()=>{

 wrap["A"]()
 console.log("Hello")
}

x()

