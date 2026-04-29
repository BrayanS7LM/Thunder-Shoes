<?php
session_start();
include("conexion.php");

if (!isset($_POST['nombre'], $_POST['email'], $_POST['password'], $_POST['telefono'])) {
    echo "DATOS_INCOMPLETOS";
    exit;
}

$nombre   = trim($_POST['nombre']);
$email    = trim($_POST['email']);
$password = $_POST['password'];
$telefono = trim($_POST['telefono']);

if (empty($nombre) || empty($email) || empty($password) || empty($telefono)) {
    echo "CAMPOS_VACIOS";
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "EMAIL_INVALIDO";
    exit;
}

$stmt = $conexion->prepare("SELECT id_usuario FROM Usuario WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "EXISTE";
    exit;
}

$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conexion->prepare(
    "INSERT INTO Usuario (nombre, email, password, telefono, fecha_registro) VALUES (?, ?, ?, ?, NOW())"
);
$stmt->bind_param("ssss", $nombre, $email, $password_hash, $telefono);

if ($stmt->execute()) {
    // ✅ Guardar sesión con el ID del nuevo usuario
    $nuevo_id = $stmt->insert_id;
    $_SESSION['usuario_id']   = $nuevo_id;
    $_SESSION['usuario_nombre'] = $nombre;
    $_SESSION['autenticado']  = true;
    echo "OK";
} else {
    echo "ERROR";
}

$stmt->close();
$conexion->close();
?>
