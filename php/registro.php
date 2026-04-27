<?php
include("conexion.php");

// Validar que lleguen datos
if (!isset($_POST['nombre'], $_POST['email'], $_POST['password'])) {
    echo "DATOS_INCOMPLETOS";
    exit;
}

// Limpiar datos
$nombre = trim($_POST['nombre']);
$email = trim($_POST['email']);
$password = $_POST['password'];

// Validar campos vacíos
if (empty($nombre) || empty($email) || empty($password)) {
    echo "CAMPOS_VACIOS";
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "EMAIL_INVALIDO";
    exit;
}

// Verificar si el usuario ya existe
$stmt = $conexion->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "EXISTE";
    exit;
}

// Encriptar contraseña
$password_hash = password_hash($password, PASSWORD_BCRYPT);

// Insertar usuario
$stmt = $conexion->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $nombre, $email, $password_hash);

if ($stmt->execute()) {
    echo "OK";
} else {
    echo "ERROR";
}

$stmt->close();
$conexion->close();
?>