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

async function loadProfile() {
    try {
        const response = await fetch("/api/user/dashboard");
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = "/login.html";
            return;
        }
        
        const user = data.user;
        document.getElementById("fullName").textContent = user.fullname || '---';
        document.getElementById("email").textContent = user.email || '---';
        document.getElementById("accountNumber").textContent = user.account_number || '---';
        document.getElementById("memberSince").textContent = user.created_at ? new Date(user.created_at).toLocaleDateString() : '---';
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const authenticated = await checkAuth();
    if (authenticated) {
        loadProfile();
    }
});