const bcrypt = require("bcrypt");

async function generateHash() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const customerPassword = await bcrypt.hash("Password123!", 10);

  console.log("Admin:", adminPassword);
  console.log("Customer:", customerPassword);
}

generateHash();