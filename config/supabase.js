const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET;

console.log("=========================================");
console.log("SUPABASE URL:", supabaseUrl);
console.log("SUPABASE KEY exists:", !!supabaseKey);
console.log("=========================================");

if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Missing Supabase environment variables!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;