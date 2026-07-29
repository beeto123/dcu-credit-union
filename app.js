const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// ================= Routes =================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ================= Middleware =================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? [
            "https://dcu-credit-union.vercel.app",
            "https://dcu-credit-union-lkvqoe45e-olowoeggboygmailcoms-projects.vercel.app"
        ]
        : true,
    credentials: true
}));

// ================= PostgreSQL Session Store =================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL ||
        "postgresql://postgres:ulp27zEPkpF2qTq6@db.orokpejzphimudspsfew.supabase.co:5432/postgres",

    ssl: {
        rejectUnauthorized: false
    },

    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
});

// Test DB Connection
pool.connect((err, client, release) => {

    if (err) {

        console.error("❌ Database connection failed:");
        console.error(err.message);

    } else {

        console.log("✅ PostgreSQL connected successfully");
        release();

    }

});

// ================= Session =================

app.use(
    session({

        store: new pgSession({
            pool: pool,
            tableName: "session",
            pruneSessionInterval: 60
        }),

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        name: "dcu.sid",

        cookie: {

            secure: process.env.NODE_ENV === "production",

            httpOnly: true,

            sameSite: "lax",

            maxAge: 1000 * 60 * 60 * 24 * 7

        }

    })
);

// ================= Debug Session =================

app.use((req, res, next) => {

    console.log("====================================");
    console.log("Request:", req.method, req.path);
    console.log("Session ID:", req.sessionID);
    console.log("Session User:", req.session.user);
    console.log("====================================");

    next();

});

// ================= Static Files =================

app.use(express.static("public"));

// Remove trailing slash

app.use((req, res, next) => {

    if (req.path.length > 1 && req.path.endsWith("/")) {

        return res.redirect(301, req.path.slice(0, -1));

    }

    next();

});

// ================= API Routes =================

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// ================= Pages =================

app.get("/", (req, res) => {

    res.sendFile(__dirname + "/public/login.html");

});

// ================= Test Supabase =================

app.get("/test-supabase", async (req, res) => {

    try {

        const supabase = require("./config/supabase");

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .limit(1);

        if (error) {

            return res.json({
                success: false,
                error
            });

        }

        res.json({
            success: true,
            data
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }

});

app.get("/debug-session", (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        cookie: req.headers.cookie || null,
        user: req.session.user || null
    });
});

// ================= Export for Vercel =================

module.exports = app;

// ================= Local Development =================

if (process.env.NODE_ENV !== "production") {

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {

        console.log(`🚀 Unity Credit Union running on http://localhost:${PORT}`);

    });

}