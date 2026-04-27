<?php
include("conexion.php");

// Validar que lleguen datos
if (!isset($_POST['nombre'], $_POST['email'], $_POST['password'], $_POST['telefono'])) {
    echo "DATOS_INCOMPLETOS";
    exit;
}

// Limpiar datos
$nombre = trim($_POST['nombre']);
$email = trim($_POST['email']);
$password = $_POST['password'];
$telefono = trim($_POST['telefono']);

// Validar campos vacíos
if (empty($nombre) || empty($email) || empty($password) || empty($telefono)) {
    echo "CAMPOS_VACIOS";
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "EMAIL_INVALIDO";
    exit;
}

// Verificar si el usuario ya existe
$stmt = $conexion->prepare("SELECT id_usuario FROM Usuario WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "EXISTE";
    exit;
}

// Encriptar contraseña
$password_hash = password_hash($password, PASSWORD_BCRYPT);

// Insertar usuario (fecha_registro se asigna automáticamente con NOW())
$stmt = $conexion->prepare("INSERT INTO Usuario (nombre, email, password, telefono, fecha_registro) VALUES (?, ?, ?, ?, NOW())");
$stmt->bind_param("ssss", $nombre, $email, $password_hash, $telefono);

if ($stmt->execute()) {
    echo "OK";
} else {
    echo "ERROR";
}

$stmt->close();
$conexion->close();
?>
