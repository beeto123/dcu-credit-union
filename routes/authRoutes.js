const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Login
router.post("/login", authController.login);

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Get session (check if logged in)
router.get("/session", authController.getSession);

module.exports = router;