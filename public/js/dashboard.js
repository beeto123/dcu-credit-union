async function loadDashboard() {
    try {
        const response = await fetch("/api/user/dashboard");
        const data = await response.json();

        if (!data.success) {
            window.location.href = "/login.html";
            return;
        }

        const user = data.user;
        const transactions = data.transactions || [];
        const withdrawals = data.withdrawals || [];

        // Update welcome message
        const hour = new Date().getHours();
        let greeting = "Good morning";
        if (hour >= 12 && hour < 17) greeting = "Good afternoon";
        else if (hour >= 17) greeting = "Good evening";
        
        document.getElementById("welcomeMessage").textContent = 
            `${greeting}, ${user.fullname || 'Customer'}! 🎉`;

        document.getElementById("customerName").textContent = user.fullname || 'Customer';

        // Update balances with comma formatting
        const checking = Number(user.checking_balance) || 0;
        const savings = Number(user.savings_balance) || 0;
        const total = checking + savings;

        // Format with commas and 2 decimal places
        const formatMoney = (amount) => {
            return amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

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
        window.location.href = "/login.html";
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
        
        let amountColor = isCredit ? 'amount-positive' : 'amount-negative';
        let amountSymbol = isCredit ? '+' : '-';
        let statusClass = 'status-completed';
        let statusText = (transaction.status || 'completed').toUpperCase();

        if (isFailed) {
            statusClass = 'status-rejected';
            statusText = 'REJECTED';
        } else if (isPending) {
            statusClass = 'status-pending';
            statusText = 'PENDING';
        }

        // Format amount with commas
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
            <td class="${amountColor}">
                ${amountSymbol}$${formatAmount(transaction.amount)}
            </td>
            <td class="${statusClass}">${statusText}</td>
        `;
        tableBody.appendChild(row);
    });
}

function loadWithdrawals(withdrawals) {
    const notificationsContainer = document.querySelector(".notifications");
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

// Also update the transaction amounts in admin profile view
// This function is called from admin-customer-view.js

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