<?php
session_start();
include("conexion.php");
require "../vendor/autoload.php";

use PragmaRX\Google2FA\Google2FA;

// Verificar que hay una sesión MFA pendiente
if (!isset($_SESSION['mfa_pendiente']) || !$_SESSION['mfa_pendiente']) {
    echo "SESION_EXPIRADA";
    exit;
}

$codigo     = $_POST['codigo'] ?? '';
$usuario_id = $_SESSION['mfa_usuario_id'];

// Obtener el secreto desde la BD
$stmt = $conexion->prepare("SELECT nombre, mfa_secret FROM Usuario WHERE id_usuario = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result = $stmt->get_result();
$usuario = $result->fetch_assoc();

// Verificar el código
$google2fa = new Google2FA();
$valido = $google2fa->verifyKey($usuario['mfa_secret'], $codigo);

if ($valido) {
    // Limpiar sesión MFA y dar acceso
    unset($_SESSION['mfa_pendiente']);
    echo "OK:" . $usuario['nombre'];
} else {
    echo "CODIGO_INVALIDO";
}

$stmt->close();
$conexion->close();
?>
