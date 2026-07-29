const supabase = require("../config/supabase");

exports.getDashboard = async (req, res) => {
    try {
        console.log("=========================================");
        console.log("DASHBOARD REQUEST");
        console.log("Session user:", req.session.user);
        console.log("=========================================");

        if (!req.session.user) {
            console.log("No session user found");
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const userId = req.session.user.id;
        console.log("Fetching dashboard for user ID:", userId);

        const { data: user, error } = await supabase
            .from("users")
            .select(`
                id,
                full_name,
                email,
                account_number,
                routing_number,
                checking_balance,
                savings_balance,
                role,
                created_at
            `)
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return res.status(404).json({
                success: false,
                message: "User not found.",
                error: error.message
            });
        }

        if (!user) {
            console.error("User not found for ID:", userId);
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        console.log("User found:", user.full_name, "Role:", user.role);

        // Get transactions
        const { data: transactions } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

        // Get withdrawals
        const { data: withdrawals } = await supabase
            .from("withdrawals")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

        const responseData = {
            success: true,
            user: {
                id: user.id,
                fullname: user.full_name || 'Customer',
                email: user.email,
                account_number: user.account_number || 'N/A',
                routing_number: user.routing_number || 'N/A',
                checking_balance: Number(user.checking_balance) || 0,
                savings_balance: Number(user.savings_balance) || 0,
                role: user.role,
                created_at: user.created_at
            },
            transactions: transactions || [],
            withdrawals: withdrawals || []
        };

        console.log("Sending dashboard data for:", user.full_name);
        res.json(responseData);

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};