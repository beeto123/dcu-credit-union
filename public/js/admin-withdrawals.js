document.addEventListener("DOMContentLoaded", () => {
    loadWithdrawals();
});

let allWithdrawals = [];
let currentFilter = 'all';

async function loadWithdrawals() {
    const tableBody = document.querySelector("#withdrawalTable");

    try {
        const response = await fetch("/api/admin/withdrawals");
        
        if (!response.ok) {
            throw new Error("Failed to load withdrawals");
        }

        allWithdrawals = await response.json();
        renderWithdrawals(allWithdrawals);

    } catch (error) {
        console.error("Error loading withdrawals:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Unable to load withdrawals.</td>
            </tr>
        `;
    }
}

function renderWithdrawals(withdrawals) {
    const tableBody = document.querySelector("#withdrawalTable");

    if (!withdrawals || withdrawals.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">No withdrawal requests found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";

    withdrawals.forEach(withdrawal => {
        const row = document.createElement("tr");
        
        const statusColors = {
            pending: '#f59e0b',
            approved: '#1b8f4a',
            rejected: '#d62828'
        };
        
        const statusBadge = `
            <span style="background:${statusColors[withdrawal.status] || '#666'}; 
                         color:white; 
                         padding:5px 12px; 
                         border-radius:20px; 
                         font-size:13px; 
                         font-weight:bold;
                         text-transform:uppercase;">
                ${withdrawal.status}
            </span>
        `;

        let actionButtons = '';
        if (withdrawal.status === 'pending') {
            actionButtons = `
                <button onclick="approveWithdrawal('${withdrawal.id}')" 
                        class="approve" 
                        style="padding:8px 16px; font-size:13px; margin-right:5px;">
                    <i class="fa-solid fa-check"></i> Approve
                </button>
                <button onclick="openRejectModal('${withdrawal.id}')" 
                        class="decline" 
                        style="padding:8px 16px; font-size:13px;">
                    <i class="fa-solid fa-times"></i> Reject
                </button>
            `;
        } else if (withdrawal.status === 'rejected') {
            actionButtons = `
                <span style="color:#d62828; font-size:13px;">
                    <i class="fa-solid fa-comment"></i> ${withdrawal.admin_note || 'No reason provided'}
                </span>
            `;
        } else {
            actionButtons = `
                <span style="color:#1b8f4a; font-size:13px;">
                    <i class="fa-solid fa-check-circle"></i> Completed
                </span>
            `;
        }

        row.innerHTML = `
            <td>${withdrawal.users?.full_name || 'Unknown'}</td>
            <td>${withdrawal.account_type || '---'}</td>
            <td style="font-weight:bold; color:#d62828;">
                -$${Number(withdrawal.amount).toFixed(2)}
            </td>
            <td>${statusBadge}</td>
            <td>${new Date(withdrawal.created_at).toLocaleDateString()}</td>
            <td>${actionButtons}</td>
        `;

        tableBody.appendChild(row);
    });
}

function filterWithdrawals(status) {
    currentFilter = status;
    
    document.querySelectorAll('#filterAll, #filterPending, #filterApproved, #filterRejected').forEach(btn => {
        btn.style.opacity = '0.6';
    });
    
    const statusMap = {
        'all': 'filterAll',
        'pending': 'filterPending',
        'approved': 'filterApproved',
        'rejected': 'filterRejected'
    };
    
    const activeBtn = document.getElementById(statusMap[status]);
    if (activeBtn) activeBtn.style.opacity = '1';
    
    if (status === 'all') {
        renderWithdrawals(allWithdrawals);
    } else {
        const filtered = allWithdrawals.filter(w => w.status === status);
        renderWithdrawals(filtered);
    }
}

async function approveWithdrawal(id) {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) return;

    try {
        const response = await fetch(`/api/admin/withdrawals/${id}/approve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('Withdrawal approved successfully!');
            loadWithdrawals();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error("Approve error:", error);
        alert('Unable to approve withdrawal. Please try again.');
    }
}

function openRejectModal(id) {
    document.getElementById("rejectWithdrawalId").value = id;
    document.getElementById("rejectReason").value = '';
    document.getElementById("rejectModal").style.display = "flex";
}

document.getElementById("rejectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("rejectWithdrawalId").value;
    const reason = document.getElementById("rejectReason").value || "Request rejected by admin";

    try {
        const response = await fetch(`/api/admin/withdrawals/${id}/reject`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason: reason })
        });

        const result = await response.json();

        if (result.success) {
            alert('Withdrawal rejected successfully!');
            document.getElementById("rejectModal").style.display = "none";
            loadWithdrawals();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error("Reject error:", error);
        alert('Unable to reject withdrawal. Please try again.');
    }
});

document.getElementById("closeRejectModal").addEventListener("click", () => {
    document.getElementById("rejectModal").style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.style.display = "none";
    }
});