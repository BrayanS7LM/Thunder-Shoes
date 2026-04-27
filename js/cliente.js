document.addEventListener("DOMContentLoaded", function() {
    const cerrarSesionBtn = document.getElementById("cerrar-sesion");

    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener("click", function(e) {
            e.preventDefault();

            // Eliminar usuario activo del localStorage
            localStorage.removeItem("usuarioActivo");

            // También puedes limpiar el carrito, si está guardado
            localStorage.removeItem("carrito");

            alert("Sesión cerrada exitosamente.");
            window.location.href = "login.html"; // Redirige al login
        });
    }
});