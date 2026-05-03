document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email-registro").value.trim();
    const telefono = document.getElementById("telefono-registro").value.trim();
    const password = document.getElementById("password-registro").value;
    const confirmarPassword = document.getElementById("confirmar-password").value;
    const terminos = document.getElementById("terminos").checked;

    if (!terminos) {
        alert("Debes aceptar los términos y condiciones.");
        return;
    }

    if (password !== confirmarPassword) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    if (password.length < 8) {
        alert("La contraseña debe tener mínimo 8 caracteres.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("Por favor, ingrese un email válido.");
        return;
    }

    fetch("/php/registro.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&telefono=${encodeURIComponent(telefono)}`
    })
    .then(res => res.text())
    .then(data => {
        switch(data.trim()) {
            case "OK":
                window.location.href = "setup_mfa.html";
                break;
            case "EXISTE":
                alert("Este correo ya está registrado.");
                break;
            case "EMAIL_INVALIDO":
                alert("Correo inválido.");
                break;
            case "CAMPOS_VACIOS":
                alert("Completa todos los campos.");
                break;
            case "DATOS_INCOMPLETOS":
                alert("Faltan datos requeridos.");
                break;
            default:
                alert("Error en el registro: " + data);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error de conexión. Verifica que el servidor esté activo.");
    });
});


// 👁️ Mostrar / ocultar contraseña principal
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password-registro");

togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;

    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
});


// 👁️ Mostrar / ocultar confirmar contraseña
const toggleConfirmar = document.getElementById("toggleConfirmar");
const confirmarInput = document.getElementById("confirmar-password");

toggleConfirmar.addEventListener("click", () => {
    const type = confirmarInput.type === "password" ? "text" : "password";
    confirmarInput.type = type;

    toggleConfirmar.classList.toggle("fa-eye");
    toggleConfirmar.classList.toggle("fa-eye-slash");
});
