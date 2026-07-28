// Check if customer is logged in
async function checkAuth() {
    try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        
        if (!data.loggedIn || data.role !== 'customer') {
            window.location.href = "/login.html";
            return false;
        }
        return true;
    } catch (error) {
        window.location.href = "/login.html";
        return false;
    }
}

// Format money with commas
function formatMoney(amount) {
    return Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

async function loadBalance() {
    try {
        const response = await fetch("/api/user/dashboard");
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = "/login.html";
            return;
        }
        
        const user = data.user;
        const checking = Number(user.checking_balance) || 0;
        const savings = Number(user.savings_balance) || 0;
        const total = checking + savings;
        
        document.getElementById("availableBalance").textContent = "$" + formatMoney(total);
        
        // Update profile name
        if (document.getElementById("customerName")) {
            document.getElementById("customerName").textContent = user.fullname || 'Customer';
        }
        
        // Update avatar initials
        const initials = user.fullname ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CU';
        if (document.getElementById("avatarInitials")) {
            document.getElementById("avatarInitials").textContent = initials;
        }
    } catch (error) {
        console.error("Error loading balance:", error);
    }
}

// Submit withdrawal request
document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const amount = document.getElementById("amount").value;
    const accountType = document.getElementById("accountType").value;
    const description = document.getElementById("description").value || "Withdrawal request";
    
    try {
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.loggedIn) {
            alert("Please login first.");
            window.location.href = "/login.html";
            return;
        }
        
        const response = await fetch(`/api/admin/withdrawals/${sessionData.userId}/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                account_type: accountType,
                description: description
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const successMsg = document.createElement("div");
            successMsg.style.cssText = `
                background: #d4edda;
                color: #155724;
                padding: 15px 20px;
                border-radius: 10px;
                margin-top: 20px;
                border-left: 5px solid #28a745;
                font-weight: 600;
            `;
            successMsg.innerHTML = `
                <i class="fa-solid fa-check-circle" style="margin-right: 10px;"></i>
                Withdrawal request submitted! Waiting for admin approval.
            `;
            
            const existing = document.querySelector(".withdraw-message");
            if (existing) existing.remove();
            
            successMsg.className = "withdraw-message";
            document.querySelector(".withdraw-card").appendChild(successMsg);
            
            document.getElementById("withdrawForm").reset();
            loadBalance();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Withdrawal request error:", error);
        alert("Unable to submit withdrawal request. Please try again.");
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    const authenticated = await checkAuth();
    if (authenticated) {
        loadBalance();
    }
});