const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
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

app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? ["https://dcu-credit-union.vercel.app", "https://dcu-credit-union-lkvqoe45e-olowoeggboygmailcoms-projects.vercel.app"]
        : true,
    credentials: true
}));

// ================= Session Store in Supabase =================

// Create PostgreSQL connection pool using Supabase connection pooler
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ulp27zEPkpF2qTq6@db.orokpejzphimudspsfew.supabase.co:5432/postgres",
    ssl: {
        rejectUnauthorized: false
    },
    max: 1, // Vercel serverless limit
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        console.error("❌ Database connection error:", err.message);
    } else {
        console.log("✅ Database connected successfully");
        release();
    }
});

// Session configuration with database store
app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: "session",
            pruneSessionInterval: 60
        }),
        secret: process.env.SESSION_SECRET || "dcu-credit-union-secret-key-2024",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: "lax",
            domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined
        },
        name: "dcu.sid",
        rolling: true
    })
);

// ================= Session Debug Middleware =================
app.use((req, res, next) => {
    console.log("🔍 Session Debug - Path:", req.path);
    console.log("🔍 Session ID:", req.sessionID);
    console.log("🔍 Session User:", req.session.user);
    next();
});

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

// ================= Test Supabase Connection =================
app.get("/test-supabase", async (req, res) => {
    try {
        const supabase = require("./config/supabase");
        const { data, error } = await supabase
            .from("users")
            .select("count")
            .limit(1);
        
        if (error) {
            return res.json({
                success: false,
                error: error.message,
                details: error
            });
        }
        
        res.json({
            success: true,
            message: "Supabase connected successfully!",
            data: data
        });
    } catch (err) {
        res.json({
            success: false,
            error: err.message,
            stack: err.stack
        });
    }
});

// ================= Export for Vercel =================
module.exports = app;

// ================= Keep the listen for local development =================
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Unity Credit Union running on http://localhost:${PORT}`);
    });
}