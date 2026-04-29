<?php
session_start();
include("conexion.php");

$telefono = trim($_POST['telefono'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($telefono) || empty($password)) {
    echo "CAMPOS_VACIOS";
    exit;
}

// Buscar usuario por teléfono
$stmt = $conexion->prepare(
    "SELECT id_usuario, nombre, password FROM Usuario WHERE telefono = ?"
);
$stmt->bind_param("s", $telefono);
$stmt->execute();
$result  = $stmt->get_result();
$usuario = $result->fetch_assoc();

if (!$usuario) {
    echo "NO_EXISTE";
    exit;
}

// Verificar contraseña
if (!password_verify($password, $usuario['password'])) {
    echo "PASSWORD_INCORRECTO";
    exit;
}

// ✅ Identidad confirmada → crear sesión
$_SESSION['usuario_id']     = $usuario['id_usuario'];
$_SESSION['usuario_nombre'] = $usuario['nombre'];
$_SESSION['autenticado']    = true;

echo "OK";

$stmt->close();
$conexion->close();
?>
