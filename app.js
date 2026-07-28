const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ================= Middleware =================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "unity-credit-union-secret-key-2024",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            sameSite: "lax"
        }
    })
);

// Static Files
app.use(express.static("public"));

// Remove trailing slash
app.use((req, res, next) => {
    if (req.path.length > 1 && req.path.endsWith('/')) {
        const newPath = req.path.slice(0, -1);
        res.redirect(301, newPath);
    } else {
        next();
    }
});

// ================= Routes =================

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ================= Pages =================

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// ================= Server =================

const PORT = process.env.PORT || 3000;

// Export for Vercel
module.exports = app;

// Keep the listen for local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Unity Credit Union running on http://localhost:${PORT}`);
    });
}