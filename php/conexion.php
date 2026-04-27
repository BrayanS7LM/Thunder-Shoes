<?php
$servidor = "localhost";
$usuario = "THUNDER-BASES";
$password = "WconYandel";
$base_datos = "thunder_shoes";
$conexion = new mysqli($servidor, $usuario, $password, $base_datos);

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

$conexion->set_charset("utf8");
?>
