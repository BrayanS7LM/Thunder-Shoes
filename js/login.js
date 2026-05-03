document.querySelector(".form-inicio-sesion").addEventListener("submit", function(e) {
    e.preventDefault();

    const email    = document.getElementById("email-login").value.trim();
    const password = document.getElementById("password-login").value;

    fetch("/php/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(res => res.text())
    .then(data => {
        if (data.startsWith("OK:")) {
            const nombre = data.split(":")[1];
            localStorage.setItem("usuarioActivo", JSON.stringify({ nombre: nombre, email: email }));
            alert("¡Bienvenido, " + nombre + "!");
            window.location.href = "../pages/cliente.html";

        } else if (data === "MFA_REQUERIDO") {
            // 👉 Redirigir a la pantalla del código MFA
            window.location.href = "../pages/mfa.html";

        } else if (data === "NO_EXISTE" || data === "PASSWORD_INCORRECTO") {
            alert("Correo o contraseña incorrectos.");
        } else {
            alert("Error: " + data);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error de conexión.");
    });
});

const toggleLogin = document.getElementById("toggleLogin");
const passwordInput = document.getElementById("password-login");

if (toggleLogin && passwordInput) {
    toggleLogin.addEventListener("click", () => {
        const tipo = passwordInput.type === "password" ? "text" : "password";
        passwordInput.type = tipo;

        toggleLogin.classList.toggle("fa-eye");
        toggleLogin.classList.toggle("fa-eye-slash");
    });
}
