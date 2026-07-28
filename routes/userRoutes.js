const express = require("express");

const router = express.Router();

const userController = require("../controllers/userController");

// Dashboard Data
router.get("/dashboard", userController.getDashboard);

module.exports = router;