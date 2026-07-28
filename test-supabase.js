require("dotenv").config();

const supabase = require("./config/supabase");

async function test(){

    const {data,error} = await supabase
        .from("users")
        .select("*");

    if(error){
        console.log("SUPABASE ERROR:");
        console.log(error);
    }
    else{
        console.log("SUPABASE SUCCESS:");
        console.log(data);
    }

}

test();