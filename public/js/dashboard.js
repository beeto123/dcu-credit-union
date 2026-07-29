async function loadDashboard() {
    try {
        console.log("Loading dashboard...");
        const response = await fetch("/api/user/dashboard");
        console.log("Dashboard response status:", response.status);
        
        const data = await response.json();
        console.log("Dashboard data received:", data);

        if (!data.success) {
            console.error("Dashboard error:", data.message);
            document.getElementById("welcomeMessage").textContent = "⚠️ Unable to load dashboard. Please refresh.";
            return;
        }

        const user = data.user;
        const transactions = data.transactions || [];
        const withdrawals = data.withdrawals || [];

        console.log("User data:", user);

        // Update welcome message
        const hour = new Date().getHours();
        let greeting = "Good morning";
        if (hour >= 12 && hour < 17) greeting = "Good afternoon";
        else if (hour >= 17) greeting = "Good evening";
        
        document.getElementById("welcomeMessage").textContent = 
            `${greeting}, ${user.fullname || 'Customer'}! 🎉`;

        document.getElementById("customerName").textContent = user.fullname || 'Customer';

        // Format money
        const formatMoney = (amount) => {
            return Number(amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // Update balances - these IDs exist in your HTML
        const checking = Number(user.checking_balance) || 0;
        const savings = Number(user.savings_balance) || 0;
        const total = checking + savings;

        document.getElementById("checkingBalance").textContent = `$${formatMoney(checking)}`;
        document.getElementById("savingsBalance").textContent = `$${formatMoney(savings)}`;
        document.getElementById("totalBalance").textContent = `$${formatMoney(total)}`;

        // Update account numbers
        const accountNum = user.account_number || '********';
        const maskedAccount = accountNum.slice(-4);
        document.getElementById("checkingAccount").textContent = `****${maskedAccount}`;
        document.getElementById("savingsAccount").textContent = `****${maskedAccount}`;

        // Avatar initials
        const initials = user.fullname ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CU';
        document.getElementById("avatarInitials").textContent = initials;

        // Load transactions
        loadTransactions(transactions);

        // Load withdrawals
        loadWithdrawals(withdrawals);

    } catch (error) {
        console.error("Error loading dashboard:", error);
        document.getElementById("welcomeMessage").textContent = "⚠️ Error loading dashboard. Please refresh.";
    }
}

function loadTransactions(transactions) {
    const tableBody = document.getElementById("transactionTable");

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:20px; color:#999;">
                    No transactions yet.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";

    // Show last 10 transactions
    const recentTransactions = transactions.slice(0, 10);

    recentTransactions.forEach(transaction => {
        const row = document.createElement("tr");
        
        const isCredit = transaction.type === 'deposit' || transaction.type === 'interest';
        const isFailed = transaction.status === 'failed' || transaction.status === 'rejected';
        const isPending = transaction.status === 'pending';
        
        let amountColor = isCredit ? '#1b8f4a' : '#d62828';
        let amountSymbol = isCredit ? '+' : '-';
        let statusColor = '#1b8f4a';
        let statusText = (transaction.status || 'completed').toUpperCase();

        if (isFailed) {
            statusColor = '#d62828';
            statusText = 'REJECTED';
        } else if (isPending) {
            statusColor = '#f59e0b';
            statusText = 'PENDING';
        }

        const formatAmount = (amount) => {
            return Number(amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // Category tag
        const categoryMap = {
            'deposit': 'deposit',
            'withdrawal': 'withdrawal',
            'transfer': 'transfer',
            'interest': 'deposit'
        };
        const categoryClass = categoryMap[transaction.type] || 'transfer';
        const categoryLabel = transaction.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : 'Transfer';

        row.innerHTML = `
            <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
            <td>${transaction.description || transaction.type || '---'}</td>
            <td><span class="tag ${categoryClass}">${categoryLabel}</span></td>
            <td style="color:${amountColor}; font-weight:bold;">
                ${amountSymbol}$${formatAmount(transaction.amount)}
            </td>
            <td style="color:${statusColor}; font-weight:bold;">${statusText}</td>
        `;
        tableBody.appendChild(row);
    });
}

function loadWithdrawals(withdrawals) {
    const notificationsContainer = document.getElementById("notificationsList");
    if (!notificationsContainer) return;

    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

    let notificationsHTML = '';
    
    if (pendingWithdrawals.length > 0) {
        notificationsHTML += `
            <li>
                You have <strong>${pendingWithdrawals.length}</strong> pending withdrawal 
                request${pendingWithdrawals.length > 1 ? 's' : ''} awaiting approval.
            </li>
        `;
    }

    notificationsHTML += `
        <li>Your eStatement is now available.</li>
        <li>Security Alert: New login detected.</li>
    `;

    notificationsContainer.innerHTML = notificationsHTML;
}

// Logout
document.querySelector(".logout a")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        await fetch("/api/auth/logout");
        window.location.href = "/login.html";
    } catch (error) {
        window.location.href = "/login.html";
    }
});

// Load dashboard on page load
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});