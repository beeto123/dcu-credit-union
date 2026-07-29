const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("/api/auth/login", {

            method: "POST",

            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        if (data.role === "admin") {
            window.location.href = "/admin-dashboard.html";
        } else {
            window.location.href = "/dashboard.html";
        }

    } catch (err) {

        console.error(err);

        alert("Unable to connect to server.");

    }

});