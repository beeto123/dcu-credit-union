const bcrypt = require("bcrypt");
const supabase = require("../config/supabase");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("=========================================");
        console.log("LOGIN ATTEMPT:", email);
        console.log("=========================================");

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (error) {
            console.log("Supabase error:", error);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user) {
            console.log("User not found:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        console.log("User found:", user.full_name, "Role:", user.role);

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            console.log("Invalid password for:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Set session - using the exact same structure for all users
        req.session.user = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Session error. Please try again."
                });
            }

            console.log("✅ LOGIN SUCCESSFUL for:", email);
            console.log("Session user:", req.session.user);
            console.log("Session ID:", req.sessionID);

            return res.json({
                success: true,
                role: user.role
            });
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.redirect("/");
    });
};

// Get session (check if logged in)
exports.getSession = async (req, res) => {
    try {
        console.log("Session check - Session ID:", req.sessionID);
        console.log("Session user:", req.session.user);

        if (!req.session.user) {
            return res.json({
                loggedIn: false,
                message: "Not logged in"
            });
        }

        // Get user details from database
        const { data: user, error } = await supabase
            .from("users")
            .select("id, full_name, email, role")
            .eq("id", req.session.user.id)
            .single();

        if (error || !user) {
            return res.json({
                loggedIn: false,
                message: "User not found"
            });
        }

        res.json({
            loggedIn: true,
            userId: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        console.error("SESSION ERROR:", err);
        res.status(500).json({
            loggedIn: false,
            message: "Server error"
        });
    }
};