// Get customer ID from URL
const params = new URLSearchParams(window.location.search);
const customerId = params.get("id");
let currentCustomer = null;

async function loadCustomerProfile() {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        
        if (!response.ok) {
            throw new Error("Failed to load customer");
        }

        currentCustomer = await response.json();

        // Update page title
        document.getElementById("customerName").textContent = 
            `Viewing ${currentCustomer.full_name}'s Profile`;

        // Update info cards
        document.getElementById("fullName").textContent = currentCustomer.full_name;
        document.getElementById("email").textContent = currentCustomer.email;
        document.getElementById("accountNumber").textContent = currentCustomer.account_number;
        document.getElementById("routingNumber").textContent = currentCustomer.routing_number;

        // Update balance cards
        const formatMoney = (amount) => {
    return Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

document.getElementById("checkingBalance").textContent = 
    `$${formatMoney(currentCustomer.checking_balance)}`;
document.getElementById("savingsBalance").textContent = 
    `$${formatMoney(currentCustomer.savings_balance)}`;
        
        const total = Number(currentCustomer.checking_balance) + Number(currentCustomer.savings_balance);
        document.getElementById("totalBalance").textContent = 
            `$${total.toFixed(2)}`;
        
        document.getElementById("memberSince").textContent = 
            new Date(currentCustomer.created_at).toLocaleDateString();

        // Load transactions
        await loadTransactions(customerId);

    } catch (error) {
        console.error("Error loading customer:", error);
        document.getElementById("customerName").textContent = 
            "Unable to load customer";
    }
}

async function loadTransactions(userId) {
    const tableBody = document.querySelector("#transactionTable");
    
    try {
        const response = await fetch(`/api/admin/transactions/${userId}`);
        
        if (!response.ok) {
            throw new Error("Failed to load transactions");
        }

        const transactions = await response.json();
        
        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#666; padding:20px;">
                        No transactions yet. Use Deposit or Withdraw to create transactions.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = "";
        
        transactions.forEach(transaction => {
            const row = document.createElement("tr");
            
            const isCredit = transaction.type === 'deposit' || transaction.type === 'interest';
            const isFailed = transaction.status === 'failed' || transaction.status === 'rejected';
            
            let amountColor = isCredit ? '#1b8f4a' : '#d62828';
            let amountSymbol = isCredit ? '+' : '-';
            
            let statusColor = '#1b8f4a';
            let statusText = transaction.status.toUpperCase();
            
            if (isFailed) {
                amountColor = '#999';
                statusColor = '#d62828';
                statusText = 'REJECTED';
            }
            
            row.innerHTML = `
                <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
                <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                <td>${transaction.description || '---'}</td>
                <td style="color:${amountColor}; font-weight:bold;">
                    ${amountSymbol}$${Number(transaction.amount).toFixed(2)}
                </td>
                <td>
                    <span style="color:${statusColor}; font-weight:bold;">
                        ${statusText}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading transactions:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:#d62828; padding:20px;">
                    Unable to load transactions. Please try again.
                </td>
            </tr>
        `;
    }
}

// ==============================
// DEPOSIT FUNCTIONALITY
// ==============================
document.getElementById("depositForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const amount = document.getElementById("depositAmount").value;
    const accountType = document.getElementById("depositAccountType").value;
    const description = document.getElementById("depositDescription").value || "Deposit";
    
    try {
        const response = await fetch(`/api/admin/customers/${customerId}/deposit`, {
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
            alert("Deposit completed successfully!");
            document.getElementById("depositModal").style.display = "none";
            document.getElementById("depositForm").reset();
            loadCustomerProfile();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Deposit error:", error);
        alert("Unable to complete deposit. Please try again.");
    }
});

// ==============================
// WITHDRAW REQUEST FUNCTIONALITY
// ==============================
document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const amount = document.getElementById("withdrawAmount").value;
    const accountType = document.getElementById("withdrawAccountType").value;
    const reason = document.getElementById("withdrawReason").value || "Withdrawal request";
    
    try {
        const response = await fetch(`/api/admin/withdrawals/${customerId}/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                account_type: accountType,
                description: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert("Withdrawal request submitted successfully! Waiting for admin approval.");
            document.getElementById("withdrawModal").style.display = "none";
            document.getElementById("withdrawForm").reset();
            loadCustomerProfile();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Withdrawal request error:", error);
        alert("Unable to submit withdrawal request. Please try again.");
    }
});

// ==============================
// EDIT CUSTOMER FUNCTIONALITY
// ==============================
document.getElementById("editCustomerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const customerId = document.getElementById("editCustomerId").value;
    const fullName = document.getElementById("editFullName").value;
    const email = document.getElementById("editEmail").value;
    const phone = document.getElementById("editPhone").value;
    const address = document.getElementById("editAddress").value;
    
    try {
        const response = await fetch(`/api/admin/customers/${customerId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                phone: phone,
                address: address
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert("Customer updated successfully!");
            document.getElementById("editCustomerModal").style.display = "none";
            document.getElementById("editCustomerForm").reset();
            loadCustomerProfile();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Update error:", error);
        alert("Unable to update customer. Please try again.");
    }
});

// ==============================
// MODAL CONTROLS
// ==============================

// Open Deposit Modal
document.getElementById("openDepositModal").addEventListener("click", () => {
    document.getElementById("depositModal").style.display = "flex";
});

// Open Withdraw Modal
document.getElementById("openWithdrawModal").addEventListener("click", () => {
    document.getElementById("withdrawModal").style.display = "flex";
});

// Open Edit Modal
document.getElementById("openEditModal").addEventListener("click", () => {
    if (currentCustomer) {
        document.getElementById("editCustomerId").value = currentCustomer.id;
        document.getElementById("editFullName").value = currentCustomer.full_name || '';
        document.getElementById("editEmail").value = currentCustomer.email || '';
        document.getElementById("editPhone").value = currentCustomer.phone || '';
        document.getElementById("editAddress").value = currentCustomer.address || '';
        document.getElementById("editCustomerModal").style.display = "flex";
    }
});

// Close Modals
document.getElementById("closeDepositModal").addEventListener("click", () => {
    document.getElementById("depositModal").style.display = "none";
});

document.getElementById("closeWithdrawModal").addEventListener("click", () => {
    document.getElementById("withdrawModal").style.display = "none";
});

document.getElementById("closeEditModal").addEventListener("click", () => {
    document.getElementById("editCustomerModal").style.display = "none";
});

// Close modals when clicking outside
window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
    }
});

// Load the profile
loadCustomerProfile();