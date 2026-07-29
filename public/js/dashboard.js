async function loadDashboard() {
    try {

        console.log("Loading dashboard...");

        const response = await fetch("/api/user/dashboard", {
            credentials: "include"
        });

        console.log("Dashboard response status:", response.status);

        const data = await response.json();

        console.log("Dashboard data received:", data);

        if (!data.success) {

            console.error("Dashboard error:", data.message);

            document.getElementById("welcomeMessage").textContent =
                "⚠️ Unable to load dashboard. Please login again.";

            return;

        }

        const user = data.user;
        const transactions = data.transactions || [];
        const withdrawals = data.withdrawals || [];

        console.log("User:", user);

        // Greeting
        const hour = new Date().getHours();

        let greeting = "Good Morning";

        if (hour >= 12 && hour < 17) {

            greeting = "Good Afternoon";

        } else if (hour >= 17) {

            greeting = "Good Evening";

        }

        document.getElementById("welcomeMessage").textContent =
            `${greeting}, ${user.fullname}! 👋`;

        document.getElementById("customerName").textContent =
            user.fullname;

        // Format USD
        function formatMoney(amount) {

            return Number(amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        }

        const checking = Number(user.checking_balance || 0);
        const savings = Number(user.savings_balance || 0);

        document.getElementById("checkingBalance").textContent =
            `$${formatMoney(checking)}`;

        document.getElementById("savingsBalance").textContent =
            `$${formatMoney(savings)}`;

        document.getElementById("totalBalance").textContent =
            `$${formatMoney(checking + savings)}`;

        // Account numbers
        const account = user.account_number || "********";

        document.getElementById("checkingAccount").textContent =
            "****" + account.slice(-4);

        document.getElementById("savingsAccount").textContent =
            "****" + account.slice(-4);

        // Avatar
        const initials = user.fullname
            .split(" ")
            .map(name => name[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        document.getElementById("avatarInitials").textContent =
            initials;

        loadTransactions(transactions);

        loadWithdrawals(withdrawals);

    } catch (err) {

        console.error(err);

        document.getElementById("welcomeMessage").textContent =
            "⚠️ Unable to connect to server.";

    }
}

function loadTransactions(transactions) {

    const table = document.getElementById("transactionTable");

    if (!table) return;

    if (transactions.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:20px;">
                    No transactions found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = "";

    transactions.forEach(transaction => {

        const amount =
            Number(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2
            });

        const row = `
            <tr>

                <td>${new Date(transaction.created_at).toLocaleDateString()}</td>

                <td>${transaction.description || "-"}</td>

                <td>${transaction.type}</td>

                <td>$${amount}</td>

                <td>${transaction.status}</td>

            </tr>
        `;

        table.innerHTML += row;

    });

}

function loadWithdrawals(withdrawals) {

    const list = document.getElementById("notificationsList");

    if (!list) return;

    let html = "";

    const pending = withdrawals.filter(
        w => w.status === "pending"
    );

    if (pending.length > 0) {

        html += `
            <li>
                You have
                <strong>${pending.length}</strong>
                pending withdrawal request(s).
            </li>
        `;

    }

    html += `
        <li>Your eStatement is available.</li>
        <li>Security Alert: New login detected.</li>
    `;

    list.innerHTML = html;

}

// Logout

const logoutLink = document.querySelector(".logout a");

if (logoutLink) {

    logoutLink.addEventListener("click", async function (e) {

        e.preventDefault();

        try {

            await fetch("/api/auth/logout", {

                credentials: "include"

            });

        } catch (err) {

            console.error(err);

        }

        window.location.href = "/login.html";

    });

}

document.addEventListener("DOMContentLoaded", function () {

    loadDashboard();

});