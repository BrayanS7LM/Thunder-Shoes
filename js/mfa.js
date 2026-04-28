document.getElementById("form-mfa").addEventListener("submit", function(e) {
    e.preventDefault();

    const codigo = document.getElementById("codigo-mfa").value.trim();

    fetch("/PAGINA_WEB/php/verify_mfa.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `codigo=${encodeURIComponent(codigo)}`
    })
    .then(res => res.text())
    .then(data => {
        if (data.startsWith("OK:")) {
            const nombre = data.split(":")[1];
            localStorage.setItem("usuarioActivo", nombre);
            window.location.href = "../pages/cliente.html";

        } else if (data === "CODIGO_INVALIDO") {
            document.getElementById("mfa-error").style.display = "block";

        } else if (data === "SESION_EXPIRADA") {
            alert("Sesión expirada. Vuelve a iniciar sesión.");
            window.location.href = "../pages/login.html";

        } else {
            alert("Error inesperado: " + data);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error de conexión.");
    });
});
