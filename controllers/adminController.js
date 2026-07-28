const supabase = require("../config/supabase");

// ==============================
// GET ALL CUSTOMERS
// ==============================
exports.getCustomers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {

    console.error("GET CUSTOMERS ERROR:");
    console.error(err);

    res.status(500).json({
        success: false,
        error: err.message,
        details: err
    });

}
};

// ==============================
// CREATE CUSTOMER
// ==============================
exports.createCustomer = async (req, res) => {
    try {
        const {
            full_name,
            email,
            password,
            checking_balance,
            savings_balance
        } = req.body;

        const bcrypt = require("bcrypt");

        const hashedPassword = await bcrypt.hash(password, 10);

        const accountNumber =
            "UCU" +
            Math.floor(
                100000000 + Math.random() * 900000000
            );

        const routingNumber = "021000021";

        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    full_name,
                    email,
                    password: hashedPassword,
                    account_number: accountNumber,
                    routing_number: routingNumber,
                    checking_balance: parseFloat(checking_balance) || 0,
                    savings_balance: parseFloat(savings_balance) || 0,
                    role: "customer",
                    avatar: "/images/default-avatar.png"
                }
            ])
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: "Customer created successfully",
            customer: data
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: "Unable to create customer"
        });
    }
};

// ==============================
// DASHBOARD STATS
// ==============================
exports.getDashboardStats = async (req, res) => {
    try {
        // Total customers
        const { count: totalCustomers, error: customerError } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "customer");

        if (customerError) throw customerError;

        // Pending withdrawals
        const { count: pendingWithdrawals, error: withdrawalError } = await supabase
            .from("withdrawals")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");

        if (withdrawalError) throw withdrawalError;

        // Total deposits
        const { data: users, error: balanceError } = await supabase
            .from("users")
            .select("checking_balance,savings_balance")
            .eq("role", "customer");

        if (balanceError) throw balanceError;

        let totalDeposits = 0;

        users.forEach(user => {
            totalDeposits += Number(user.checking_balance || 0);
            totalDeposits += Number(user.savings_balance || 0);
        });

        // Total transactions
        const { count: todayTransactions, error: transactionError } = await supabase
            .from("transactions")
            .select("*", { count: "exact", head: true });

        if (transactionError) throw transactionError;

        res.json({
            totalCustomers,
            pendingWithdrawals,
            totalDeposits,
            todayTransactions
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Unable to load dashboard"
        });
    }
};

// ==============================
// GET CUSTOMER BY ID
// ==============================
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json(data);
    } catch (err) {
        console.error("GET CUSTOMER BY ID ERROR:");
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// ==============================
// GET TRANSACTIONS BY USER ID
// ==============================
exports.getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error("GET TRANSACTIONS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to load transactions"
        });
    }
};

// ==============================
// GET ALL WITHDRAWALS (Admin)
// ==============================
exports.getAllWithdrawals = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("withdrawals")
            .select(`
                *,
                users (
                    full_name,
                    email,
                    account_number
                )
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error("GET WITHDRAWALS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to load withdrawals"
        });
    }
};

// ==============================
// GET USER WITHDRAWALS
// ==============================
exports.getUserWithdrawals = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from("withdrawals")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error("GET USER WITHDRAWALS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to load withdrawals"
        });
    }
};

// ==============================
// REQUEST WITHDRAWAL (Customer)
// ==============================
exports.requestWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, account_type, description } = req.body;

        // Check if customer exists
        const { data: customer, error: customerError } = await supabase
            .from("users")
            .select("checking_balance, savings_balance")
            .eq("id", id)
            .single();

        if (customerError) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if sufficient balance
        const balanceField = account_type === 'checking' ? 'checking_balance' : 'savings_balance';
        const currentBalance = Number(customer[balanceField]);

        if (currentBalance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        // Create withdrawal request
        const { data, error } = await supabase
            .from("withdrawals")
            .insert([
                {
                    user_id: id,
                    amount: amount,
                    account_type: account_type,
                    description: description || "Withdrawal request",
                    status: "pending"
                }
            ])
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: "Withdrawal request submitted successfully. Waiting for admin approval.",
            withdrawal: data
        });

    } catch (err) {
        console.error("REQUEST WITHDRAWAL ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to submit withdrawal request"
        });
    }
};

// ==============================
// APPROVE WITHDRAWAL (Admin)
// ==============================
exports.approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;

        // Get withdrawal request
        const { data: withdrawal, error: fetchError } = await supabase
            .from("withdrawals")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: "Withdrawal request not found"
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Withdrawal is already ${withdrawal.status}`
            });
        }

        // Get customer balance
        const { data: customer, error: customerError } = await supabase
            .from("users")
            .select("checking_balance, savings_balance")
            .eq("id", withdrawal.user_id)
            .single();

        if (customerError) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if sufficient balance
        const balanceField = withdrawal.account_type === 'checking' ? 'checking_balance' : 'savings_balance';
        const currentBalance = Number(customer[balanceField]);

        if (currentBalance < withdrawal.amount) {
            // Update withdrawal status to rejected
            await supabase
                .from("withdrawals")
                .update({
                    status: "rejected",
                    admin_note: "Insufficient balance",
                    updated_at: new Date()
                })
                .eq("id", id);

            return res.status(400).json({
                success: false,
                message: "Insufficient balance. Withdrawal rejected."
            });
        }

        // Deduct balance
        const newBalance = currentBalance - withdrawal.amount;

        const { error: updateError } = await supabase
            .from("users")
            .update({ [balanceField]: newBalance })
            .eq("id", withdrawal.user_id);

        if (updateError) throw updateError;

        // Update withdrawal status
        const { error: statusError } = await supabase
            .from("withdrawals")
            .update({
                status: "approved",
                updated_at: new Date()
            })
            .eq("id", id);

        if (statusError) throw statusError;

        // Record transaction
        await supabase
            .from("transactions")
            .insert([
                {
                    user_id: withdrawal.user_id,
                    type: "withdrawal",
                    amount: withdrawal.amount,
                    description: "Withdrawal approved",
                    status: "completed",
                    merchant: "Approved Withdrawal"
                }
            ]);

        res.json({
            success: true,
            message: "Withdrawal approved successfully"
        });

    } catch (err) {
        console.error("APPROVE WITHDRAWAL ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to approve withdrawal"
        });
    }
};

// ==============================
// REJECT WITHDRAWAL (Admin)
// ==============================
exports.rejectWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get withdrawal request
        const { data: withdrawal, error: fetchError } = await supabase
            .from("withdrawals")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: "Withdrawal request not found"
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Withdrawal is already ${withdrawal.status}`
            });
        }

        // Update withdrawal status
        const rejectReason = reason || "Request rejected by admin";
        const { error: updateError } = await supabase
            .from("withdrawals")
            .update({
                status: "rejected",
                admin_note: rejectReason,
                updated_at: new Date()
            })
            .eq("id", id);

        if (updateError) throw updateError;

        // Record a transaction for the rejection (no money moved, just status)
        await supabase
            .from("transactions")
            .insert([
                {
                    user_id: withdrawal.user_id,
                    type: "withdrawal",
                    amount: withdrawal.amount,
                    description: `Withdrawal Rejected: ${rejectReason}`,
                    status: "failed",
                    merchant: "Rejected Withdrawal"
                }
            ]);

        res.json({
            success: true,
            message: "Withdrawal rejected successfully"
        });

    } catch (err) {
        console.error("REJECT WITHDRAWAL ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to reject withdrawal"
        });
    }
};

// ==============================
// DEPOSIT TO CUSTOMER
// ==============================
exports.depositToCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, account_type, description } = req.body;

        // Get current customer
        const { data: customer, error: fetchError } = await supabase
            .from("users")
            .select("checking_balance, savings_balance")
            .eq("id", id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Update balance
        const balanceField = account_type === 'checking' ? 'checking_balance' : 'savings_balance';
        const currentBalance = Number(customer[balanceField]);
        const newBalance = currentBalance + amount;

        const { error: updateError } = await supabase
            .from("users")
            .update({ [balanceField]: newBalance })
            .eq("id", id);

        if (updateError) throw updateError;

        // Record transaction
        const { error: transactionError } = await supabase
            .from("transactions")
            .insert([
                {
                    user_id: id,
                    type: "deposit",
                    amount: amount,
                    description: description || "Deposit",
                    status: "completed",
                    merchant: "Deposit"
                }
            ]);

        if (transactionError) throw transactionError;

        res.json({
            success: true,
            message: "Deposit completed successfully",
            new_balance: newBalance
        });

    } catch (err) {
        console.error("DEPOSIT ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to process deposit"
        });
    }
};

// ==============================
// WITHDRAW FROM CUSTOMER (Direct - Admin only)
// ==============================
exports.withdrawFromCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, account_type, reason } = req.body;

        // Get current customer
        const { data: customer, error: fetchError } = await supabase
            .from("users")
            .select("checking_balance, savings_balance")
            .eq("id", id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if sufficient balance
        const balanceField = account_type === 'checking' ? 'checking_balance' : 'savings_balance';
        const currentBalance = Number(customer[balanceField]);

        if (currentBalance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        // Update balance
        const newBalance = currentBalance - amount;

        const { error: updateError } = await supabase
            .from("users")
            .update({ [balanceField]: newBalance })
            .eq("id", id);

        if (updateError) throw updateError;

        // Record transaction
        const { error: transactionError } = await supabase
            .from("transactions")
            .insert([
                {
                    user_id: id,
                    type: "withdrawal",
                    amount: amount,
                    description: reason || "Withdrawal",
                    status: "completed",
                    merchant: "Withdrawal"
                }
            ]);

        if (transactionError) throw transactionError;

        res.json({
            success: true,
            message: "Withdrawal completed successfully",
            new_balance: newBalance
        });

    } catch (err) {
        console.error("WITHDRAW ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to process withdrawal"
        });
    }
};

// ==============================
// UPDATE CUSTOMER
// ==============================
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, address } = req.body;

        const { data, error } = await supabase
            .from("users")
            .update({
                full_name: full_name,
                email: email,
                phone: phone,
                address: address
            })
            .eq("id", id)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: "Customer updated successfully",
            customer: data
        });

    } catch (err) {
        console.error("UPDATE CUSTOMER ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to update customer"
        });
    }
};

// ==============================
// GET ALL TRANSFERS (Admin)
// ==============================
exports.getAllTransfers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("transfers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Get user names separately
        const userIds = [...new Set(data.map(t => t.user_id))];
        const { data: users, error: userError } = await supabase
            .from("users")
            .select("id, full_name, email, account_number")
            .in("id", userIds);

        if (userError) throw userError;

        // Combine data
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = u;
        });

        const result = data.map(transfer => ({
            ...transfer,
            users: userMap[transfer.user_id] || null
        }));

        res.json(result);
    } catch (err) {
        console.error("GET TRANSFERS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to load transfers"
        });
    }
};

// ==============================
// GET USER TRANSFERS
// ==============================
exports.getUserTransfers = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from("transfers")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error("GET USER TRANSFERS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to load transfers"
        });
    }
};

// ==============================
// REQUEST TRANSFER (Customer)
// ==============================
exports.requestTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            amount, 
            account_type, 
            recipient_name,
            recipient_bank,
            recipient_account,
            recipient_routing,
            description 
        } = req.body;

        // Check if customer exists
        const { data: customer, error: customerError } = await supabase
            .from("users")
            .select("checking_balance, savings_balance")
            .eq("id", id)
            .single();

        if (customerError) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if sufficient balance
        const balanceField = account_type === 'checking' ? 'checking_balance' : 'savings_balance';
        const currentBalance = Number(customer[balanceField]);

        if (currentBalance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        // Create transfer request
        const { data, error } = await supabase
            .from("transfers")
            .insert([
                {
                    user_id: id,
                    amount: amount,
                    account_type: account_type,
                    recipient_name: recipient_name,
                    recipient_bank: recipient_bank,
                    recipient_account: recipient_account,
                    recipient_routing: recipient_routing || '',
                    description: description || "Transfer request",
                    status: "pending"
                }
            ])
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: "Transfer request submitted successfully. Waiting for admin approval.",
            transfer: data
        });

    } catch (err) {
        console.error("REQUEST TRANSFER ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to submit transfer request"
        });
    }
};

// ==============================
// APPROVE TRANSFER (Admin)
// ==============================
exports.approveTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        // Get transfer request
        const { data: transfer, error: fetchError } = await supabase
            .from("transfers")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        if (transfer.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Transfer is already ${transfer.status}`
            });
        }

        // Get customer balance
        const { data: customer, error: customerError } = await supabase
            .from("users")
            .select("checking_balance, savings_balance")
            .eq("id", transfer.user_id)
            .single();

        if (customerError) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Check if sufficient balance
        const balanceField = transfer.account_type === 'checking' ? 'checking_balance' : 'savings_balance';
        const currentBalance = Number(customer[balanceField]);

        if (currentBalance < transfer.amount) {
            // Update transfer status to rejected
            await supabase
                .from("transfers")
                .update({
                    status: "rejected",
                    admin_note: "Insufficient balance",
                    updated_at: new Date()
                })
                .eq("id", id);

            return res.status(400).json({
                success: false,
                message: "Insufficient balance. Transfer rejected."
            });
        }

        // Deduct balance
        const newBalance = currentBalance - transfer.amount;

        const { error: updateError } = await supabase
            .from("users")
            .update({ [balanceField]: newBalance })
            .eq("id", transfer.user_id);

        if (updateError) throw updateError;

        // Update transfer status
        const { error: statusError } = await supabase
            .from("transfers")
            .update({
                status: "approved",
                updated_at: new Date()
            })
            .eq("id", id);

        if (statusError) throw statusError;

        // Record transaction
        await supabase
            .from("transactions")
            .insert([
                {
                    user_id: transfer.user_id,
                    type: "transfer",
                    amount: transfer.amount,
                    description: `Transfer to ${transfer.recipient_name} (${transfer.recipient_bank})`,
                    status: "completed",
                    merchant: "Approved Transfer"
                }
            ]);

        res.json({
            success: true,
            message: "Transfer approved successfully"
        });

    } catch (err) {
        console.error("APPROVE TRANSFER ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to approve transfer"
        });
    }
};

// ==============================
// REJECT TRANSFER (Admin)
// ==============================
exports.rejectTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get transfer request
        const { data: transfer, error: fetchError } = await supabase
            .from("transfers")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found"
            });
        }

        if (transfer.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Transfer is already ${transfer.status}`
            });
        }

        // Update transfer status
        const rejectReason = reason || "Request rejected by admin";
        const { error: updateError } = await supabase
            .from("transfers")
            .update({
                status: "rejected",
                admin_note: rejectReason,
                updated_at: new Date()
            })
            .eq("id", id);

        if (updateError) throw updateError;

        // Record a transaction for the rejection
        await supabase
            .from("transactions")
            .insert([
                {
                    user_id: transfer.user_id,
                    type: "transfer",
                    amount: transfer.amount,
                    description: `Transfer Rejected: ${rejectReason}`,
                    status: "failed",
                    merchant: "Rejected Transfer"
                }
            ]);

        res.json({
            success: true,
            message: "Transfer rejected successfully"
        });

    } catch (err) {
        console.error("REJECT TRANSFER ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Unable to reject transfer"
        });
    }
};