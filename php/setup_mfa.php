<?php
session_start();
include("conexion.php");
require "../vendor/autoload.php";

use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

if (!isset($_SESSION['autenticado']) || !$_SESSION['autenticado']) {
    http_response_code(403);
    echo json_encode(['error' => 'NO_AUTORIZADO']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

$stmt = $conexion->prepare("SELECT email FROM Usuario WHERE id_usuario = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result  = $stmt->get_result();
$usuario = $result->fetch_assoc();

if (!$usuario) {
    echo json_encode(['error' => 'USUARIO_NO_ENCONTRADO']);
    exit;
}

$google2fa = new Google2FA();
$secret    = $google2fa->generateSecretKey();

$upd = $conexion->prepare(
    "UPDATE Usuario SET mfa_secret = ?, mfa_habilitado = 1 WHERE id_usuario = ?"
);
$upd->bind_param("si", $secret, $usuario_id);
$upd->execute();

$uri = $google2fa->getQRCodeUrl('ThunderShoes', $usuario['email'], $secret);

$renderer = new ImageRenderer(
    new RendererStyle(300),
    new SvgImageBackEnd()
);
$writer = new Writer($renderer);
$qrSvg  = $writer->writeString($uri);

echo json_encode([
    'qr'     => base64_encode($qrSvg),
    'secret' => $secret
]);

$stmt->close();
$conexion->close();
?>
