document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();
});

async function loadCustomers() {
    const tableBody = document.querySelector("#customerTableBody");

    try {
        const response = await fetch("/api/admin/customers");
        const customers = await response.json();

        if (!response.ok) {
            throw new Error("Failed to load customers");
        }

        tableBody.innerHTML = "";

        customers.forEach(customer => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${customer.account_number}</td>
                <td>${customer.full_name}</td>
                <td>${customer.email}</td>
                <td>$${Number(customer.checking_balance).toFixed(2)}</td>
                <td>$${Number(customer.savings_balance).toFixed(2)}</td>
                <td>${customer.role}</td>
                <td>
                    <button class="view-btn" onclick="viewCustomer('${customer.id}')">
                        View
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load customers.
                </td>
            </tr>
        `;
    }
}

function viewCustomer(id) {
    window.location.href = `admin-customer-view.html?id=${id}`;
}

// ==============================
// NEW CUSTOMER FUNCTIONALITY
// ==============================

// Open Modal
document.getElementById("newCustomerBtn").addEventListener("click", () => {
    document.getElementById("customerModal").style.display = "flex";
});

// Close Modal
document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("customerModal").style.display = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
    }
});

// Submit Form
document.getElementById("customerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById("full_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const checkingBalance = document.getElementById("checking_balance").value || 0;
    const savingsBalance = document.getElementById("savings_balance").value || 0;
    
    try {
        const response = await fetch("/api/admin/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                password: password,
                checking_balance: parseFloat(checkingBalance),
                savings_balance: parseFloat(savingsBalance)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert("Customer created successfully!");
            document.getElementById("customerModal").style.display = "none";
            document.getElementById("customerForm").reset();
            loadCustomers(); // Refresh the table
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Create customer error:", error);
        alert("Unable to create customer. Please try again.");
    }
});