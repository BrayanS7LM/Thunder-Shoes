async function activarMFA() {
    const usuarioId = document.getElementById("usuario-id").value.trim();

    if (!usuarioId) {
        alert("Por favor ingresa el ID del usuario.");
        return;
    }

    document.getElementById("error-msg").style.display = "none";

    try {
        const res = await fetch("/PAGINA_WEB/php/setup_mfa.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `usuario_id=${encodeURIComponent(usuarioId)}`
        });

        const text = await res.text();

        // Limpiar posibles errores de PHP antes del JSON
        const jsonStart = text.indexOf('{');
        const jsonClean = text.substring(jsonStart);
        const data = JSON.parse(jsonClean);

        if (data.qr && data.secret) {
            // Decodificar el SVG desde base64
            const svgData = atob(data.qr);

            // Mostrar el QR
            document.getElementById("qr-container").innerHTML = svgData;

            // Mostrar el secreto en texto
            document.getElementById("secret-text").textContent = data.secret;

            // Cambiar al paso 2
            document.getElementById("paso-1").style.display = "none";
            document.getElementById("paso-2").style.display = "block";

        } else {
            console.error("Respuesta inesperada:", data);
            document.getElementById("error-msg").style.display = "block";
        }

    } catch (err) {
        console.error("Error al parsear respuesta:", err);
        document.getElementById("error-msg").style.display = "block";
    }
}
