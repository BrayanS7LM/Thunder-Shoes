document.addEventListener("DOMContentLoaded", function() {
    const cerrarSesionBtn = document.getElementById("cerrar-sesion");

    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener("click", function(e) {
            e.preventDefault();

            // Eliminar usuario activo del localStorage
            localStorage.removeItem("usuarioActivo");

            // Limpiar el carrito al cerrar sesión
            localStorage.removeItem("carritoThunder");
            localStorage.removeItem("carrito"); // por compatibilidad

            alert("Sesión cerrada exitosamente.");
            window.location.href = "login.html";
        });
    }
});
