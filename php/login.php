<?php
include("conexion.php");

if (!isset($_POST['email'], $_POST['password'])) {
    echo "DATOS_INCOMPLETOS";
    exit;
}

$email = trim($_POST['email']);
$password = $_POST['password'];

if (empty($email) || empty($password)) {
    echo "CAMPOS_VACIOS";
    exit;
}

$stmt = $conexion->prepare("SELECT id, nombre, password FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo "NO_EXISTE";
    exit;
}

$usuario = $result->fetch_assoc();

if (password_verify($password, $usuario['password'])) {
    echo "OK:" . $usuario['nombre'];
} else {
    echo "PASSWORD_INCORRECTO";
}

$stmt->close();
$conexion->close();
?>
