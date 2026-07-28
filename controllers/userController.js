const supabase = require("../config/supabase");

exports.getDashboard = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const userId = req.session.user.id;

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

        if (error || !user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

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

        res.json({
            success: true,
            user: {
                id: user.id,
                fullname: user.full_name,
                email: user.email,
                account_number: user.account_number,
                routing_number: user.routing_number,
                checking_balance: user.checking_balance,
                savings_balance: user.savings_balance,
                role: user.role,
                created_at: user.created_at
            },
            transactions: transactions || [],
            withdrawals: withdrawals || []
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};