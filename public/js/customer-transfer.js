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

// Submit transfer request
document.getElementById("transferForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const amount = document.getElementById("amount").value;
    const accountType = document.getElementById("accountType").value;
    const recipientName = document.getElementById("recipientName").value;
    const recipientBank = document.getElementById("recipientBank").value;
    const recipientAccount = document.getElementById("recipientAccount").value;
    const recipientRouting = document.getElementById("recipientRouting").value || '';
    const description = document.getElementById("description").value || "Transfer request";
    
    // Validate
    if (!recipientName.trim()) {
        alert("Please enter recipient name");
        return;
    }
    
    if (!recipientBank.trim()) {
        alert("Please enter recipient bank name");
        return;
    }
    
    if (!recipientAccount.trim()) {
        alert("Please enter recipient account number");
        return;
    }
    
    // Get current user ID from session
    try {
        const sessionResponse = await fetch("/api/auth/session");
        const sessionData = await sessionResponse.json();
        
        if (!sessionData.loggedIn) {
            alert("Please login first.");
            window.location.href = "/login.html";
            return;
        }
        
        const response = await fetch(`/api/admin/transfers/${sessionData.userId}/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                account_type: accountType,
                recipient_name: recipientName,
                recipient_bank: recipientBank,
                recipient_account: recipientAccount,
                recipient_routing: recipientRouting,
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
                Transfer request submitted! Waiting for admin approval.
            `;
            
            const existing = document.querySelector(".transfer-message");
            if (existing) existing.remove();
            
            successMsg.className = "transfer-message";
            document.querySelector(".transfer-card").appendChild(successMsg);
            
            document.getElementById("transferForm").reset();
            loadBalance();
        } else {
            const errorMsg = document.createElement("div");
            errorMsg.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 15px 20px;
                border-radius: 10px;
                margin-top: 20px;
                border-left: 5px solid #dc3545;
            `;
            errorMsg.innerHTML = `
                <i class="fa-solid fa-exclamation-circle" style="margin-right: 10px;"></i>
                ${result.message}
            `;
            
            const existing = document.querySelector(".transfer-message");
            if (existing) existing.remove();
            
            errorMsg.className = "transfer-message";
            document.querySelector(".transfer-card").appendChild(errorMsg);
        }
    } catch (error) {
        console.error("Transfer request error:", error);
        const errorMsg = document.createElement("div");
        errorMsg.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 10px;
            margin-top: 20px;
            border-left: 5px solid #dc3545;
        `;
        errorMsg.innerHTML = `
            <i class="fa-solid fa-exclamation-circle" style="margin-right: 10px;"></i>
            Unable to submit transfer request. Please try again.
        `;
        
        const existing = document.querySelector(".transfer-message");
        if (existing) existing.remove();
        
        errorMsg.className = "transfer-message";
        document.querySelector(".transfer-card").appendChild(errorMsg);
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    const authenticated = await checkAuth();
    if (authenticated) {
        loadBalance();
    }
});