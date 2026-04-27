document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();

    // Obtención de datos del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email-registro").value.trim();
    const password = document.getElementById("password-registro").value;
    const confirmarPassword = document.getElementById("confirmar-password").value;
    const terminos = document.getElementById("terminos").checked;

    // Validación: Términos y condiciones
    if (!terminos) {
        alert("Debes aceptar los términos y condiciones.");
        return;
    }

    // Validación de contraseña
    if (password !== confirmarPassword) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    // Validación de email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Por favor, ingrese un email válido.");
        return;
    }

    // Enviar datos al backend PHP
    fetch("../../php/registro.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(res => res.text())
    .then(data => {
        switch(data.trim()) {
            case "OK":
                alert("Registro exitoso. Ahora puedes iniciar sesión.");
                window.location.href = "login.html";
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
            default:
                alert("Error en el registro: " + data);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error de conexión. Verifica que el servidor esté activo.");
    });
});
  
