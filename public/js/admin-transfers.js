document.addEventListener("DOMContentLoaded", () => {
    loadTransfers();
});

let allTransfers = [];
let currentFilter = 'all';

async function loadTransfers() {
    const tableBody = document.querySelector("#transferTable");

    try {
        const response = await fetch("/api/admin/transfers");
        
        if (!response.ok) {
            throw new Error("Failed to load transfers");
        }

        allTransfers = await response.json();
        renderTransfers(allTransfers);

    } catch (error) {
        console.error("Error loading transfers:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:20px; color:#d62828;">
                    <i class="fa-solid fa-exclamation-circle"></i> 
                    Unable to load transfers. Please try again.
                </td>
            </tr>
        `;
    }
}

function renderTransfers(transfers) {
    const tableBody = document.querySelector("#transferTable");

    if (!transfers || transfers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:20px; color:#666;">
                    No transfer requests found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";

    transfers.forEach(transfer => {
        const row = document.createElement("tr");
        
        // Status badge
        let statusClass = 'status-pending';
        let statusText = transfer.status.toUpperCase();
        if (transfer.status === 'approved') {
            statusClass = 'status-approved';
        } else if (transfer.status === 'rejected') {
            statusClass = 'status-rejected';
        }
        
        const statusBadge = `<span class="status-badge ${statusClass}">${statusText}</span>`;

        // Action buttons
        let actionButtons = '';
        if (transfer.status === 'pending') {
            actionButtons = `
                <div class="action-buttons">
                    <button class="approve-btn" onclick="approveTransfer('${transfer.id}')">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button class="reject-btn" onclick="openRejectModal('${transfer.id}')">
                        <i class="fa-solid fa-times"></i> Reject
                    </button>
                </div>
            `;
        } else if (transfer.status === 'rejected') {
            actionButtons = `
                <span class="reject-reason">
                    <i class="fa-solid fa-comment"></i> ${transfer.admin_note || 'No reason provided'}
                </span>
            `;
        } else {
            actionButtons = `
                <span style="color:#1b8f4a; font-size:13px;">
                    <i class="fa-solid fa-check-circle"></i> Completed
                </span>
            `;
        }

        // Get customer name
        const customerName = transfer.users?.full_name || 'Unknown';

        row.innerHTML = `
            <td><strong>${customerName}</strong></td>
            <td style="font-weight:bold; color:#d62828;">
                -$${Number(transfer.amount).toFixed(2)}
            </td>
            <td>${transfer.recipient_name || '---'}</td>
            <td>${transfer.recipient_bank || '---'}</td>
            <td>${transfer.recipient_account ? '****' + transfer.recipient_account.slice(-4) : '---'}</td>
            <td>${statusBadge}</td>
            <td>${new Date(transfer.created_at).toLocaleDateString()}</td>
            <td>${actionButtons}</td>
        `;

        tableBody.appendChild(row);
    });
}

function filterTransfers(status) {
    currentFilter = status;
    
    // Update active tab styling
    document.querySelectorAll('.filter-tabs button').forEach(btn => {
        btn.style.opacity = '0.6';
        btn.classList.remove('active');
    });
    
    const statusMap = {
        'all': 'filterAll',
        'pending': 'filterPending',
        'approved': 'filterApproved',
        'rejected': 'filterRejected'
    };
    
    const activeBtn = document.getElementById(statusMap[status]);
    if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.classList.add('active');
    }
    
    if (status === 'all') {
        renderTransfers(allTransfers);
    } else {
        const filtered = allTransfers.filter(t => t.status === status);
        renderTransfers(filtered);
    }
}

async function approveTransfer(id) {
    if (!confirm('Are you sure you want to approve this transfer request?')) return;

    try {
        const response = await fetch(`/api/admin/transfers/${id}/approve`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('Transfer approved successfully!');
            loadTransfers();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error("Approve error:", error);
        alert('Unable to approve transfer. Please try again.');
    }
}

function openRejectModal(id) {
    document.getElementById("rejectTransferId").value = id;
    document.getElementById("rejectReason").value = '';
    document.getElementById("rejectModal").style.display = "flex";
}

document.getElementById("rejectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const id = document.getElementById("rejectTransferId").value;
    const reason = document.getElementById("rejectReason").value || "Request rejected by admin";

    try {
        const response = await fetch(`/api/admin/transfers/${id}/reject`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason: reason })
        });

        const result = await response.json();

        if (result.success) {
            alert('Transfer rejected successfully!');
            document.getElementById("rejectModal").style.display = "none";
            loadTransfers();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error("Reject error:", error);
        alert('Unable to reject transfer. Please try again.');
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