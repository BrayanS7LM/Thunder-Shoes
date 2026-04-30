<?php
session_start();

header('Content-Type: application/json');

// Verificar si el usuario tiene sesión activa completa
if (isset($_SESSION['usuario_id'])) {
    echo json_encode(['logueado' => true, 'nombre' => $_SESSION['usuario_nombre']]);
} else {
    echo json_encode(['logueado' => false]);
}
?>