const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value;

    const password = document.getElementById("password").value;

    const response = await fetch("/api/auth/login", {

        method: "POST",

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

});