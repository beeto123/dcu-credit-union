async function loadDashboard() {
    try {
        const response = await fetch("/api/admin/dashboard");
        const data = await response.json();

        document.getElementById("totalCustomers").textContent =
            data.totalCustomers;

        document.getElementById("pendingWithdrawals").textContent =
            data.pendingWithdrawals;

        document.getElementById("totalDeposits").textContent =
            "$" + Number(data.totalDeposits).toLocaleString();

        document.getElementById("todayTransactions").textContent =
            data.todayTransactions;

    } catch (err) {
        console.error(err);
    }
}

loadDashboard();