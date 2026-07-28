const bcrypt = require("bcrypt");
const supabase = require("../config/supabase");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        req.session.user = {
            id: user.id,
            fullName: user.full_name,
            role: user.role
        };

        return res.json({
            success: true,
            role: user.role
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
};