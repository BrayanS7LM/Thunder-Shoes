<?php
session_start();
include("conexion.php");

if (!isset($_POST['email'], $_POST['password'])) {
    echo "DATOS_INCOMPLETOS";
    exit;
}

$email    = trim($_POST['email']);
$password = $_POST['password'];

if (empty($email) || empty($password)) {
    echo "CAMPOS_VACIOS";
    exit;
}

$stmt = $conexion->prepare(
    "SELECT id_usuario, nombre, password, mfa_secret, mfa_habilitado FROM Usuario WHERE email = ?"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo "NO_EXISTE";
    exit;
}

$usuario = $result->fetch_assoc();

if (!password_verify($password, $usuario['password'])) {
    echo "PASSWORD_INCORRECTO";
    exit;
}

//  Contraseña correcta
if ($usuario['mfa_habilitado'] && $usuario['mfa_secret']) {
    // Guardar en sesión para usarlo en verify_mfa.php
    $_SESSION['mfa_usuario_id'] = $usuario['id_usuario'];
    $_SESSION['mfa_usuario_nombre'] = $usuario['nombre'];
    $_SESSION['mfa_pendiente']   = true;
    echo "MFA_REQUERIDO";
} else {
    // Sin MFA, entrar directo
    echo "OK:" . $usuario['nombre'];
}

$stmt->close();
$conexion->close();
?>
