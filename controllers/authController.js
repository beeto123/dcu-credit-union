const bcrypt = require("bcrypt");
const supabase = require("../config/supabase");

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const { data: user } = await supabase

            .from("users")

            .select("*")

            .eq("email", email)

            .single();

        if (!user) {

            return res.json({

                success: false,

                message: "Invalid email or password"

            });

        }

        const match = await bcrypt.compare(

            password,

            user.password

        );

        if (!match) {

            return res.json({

                success: false,

                message: "Invalid email or password"

            });

        }

        req.session.user = {

            id: user.id,

            role: user.role

        };

        res.json({

            success: true,

            role: user.role

        });

    }

    catch (err) {

        console.log(err);

        res.json({

            success: false,

            message: "Server Error"

        });

    }

};

// ==============================
// GET SESSION (Check if logged in)
// ==============================
exports.getSession = async (req, res) => {
    try {
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