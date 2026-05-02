// Al cargar la página, verificar si hay sesión activa
async function init() {
    try {
        const res  = await fetch("/php/check_sesion.php");
        const data = await res.text();

        document.getElementById("paso-cargando").style.display = "none";

        if (data.trim() === "OK") {
            // ✅ Tiene sesión (viene del registro) → QR directo
            await generarQR();
        } else {
            // ❌ Sin sesión → pedir teléfono + contraseña
            document.getElementById("paso-verificacion").style.display = "block";
        }

    } catch (err) {
        console.error(err);
        document.getElementById("paso-cargando").style.display = "none";
        document.getElementById("paso-error").style.display = "block";
    }
}

// Verificar identidad con teléfono + contraseña
async function verificarIdentidad() {
    const telefono = document.getElementById("telefono-mfa").value.trim();
    const password = document.getElementById("password-mfa").value;
    const errorMsg = document.getElementById("error-verificacion");

    errorMsg.style.display = "none";

    if (!telefono || !password) {
        errorMsg.textContent = "Completa todos los campos.";
        errorMsg.style.display = "block";
        return;
    }

    try {
        const res = await fetch("/php/verificar_identidad.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `telefono=${encodeURIComponent(telefono)}&password=${encodeURIComponent(password)}`
        });

        const data = await res.text();

        if (data.trim() === "OK") {
            // ✅ Identidad verificada → mostrar QR
            document.getElementById("paso-verificacion").style.display = "none";
            await generarQR();
        } else {
            errorMsg.textContent = "Teléfono o contraseña incorrectos.";
            errorMsg.style.display = "block";
        }

    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Error de conexión.";
        errorMsg.style.display = "block";
    }
}

// Generar y mostrar el QR
async function generarQR() {
    try {
        const res = await fetch("/php/setup_mfa.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: ""
        });

        if (res.status === 403) {
            document.getElementById("paso-error").style.display = "block";
            return;
        }

        const text      = await res.text();
        const jsonStart = text.indexOf('{');
        const data      = JSON.parse(text.substring(jsonStart));

        if (data.qr && data.secret) {
            document.getElementById("qr-container").innerHTML = atob(data.qr);
            document.getElementById("secret-text").textContent = data.secret;
            document.getElementById("paso-qr").style.display = "block";
        } else {
            document.getElementById("paso-error").style.display = "block";
        }

    } catch (err) {
        console.error(err);
        document.getElementById("paso-error").style.display = "block";
    }
}

// Ejecutar al cargar la página
init();
