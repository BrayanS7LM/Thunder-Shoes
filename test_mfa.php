<?php
require 'vendor/autoload.php';
use PragmaRX\Google2FA\Google2FA;

$google2fa = new Google2FA();
$secret = $google2fa->generateSecretKey();

echo "✅ Librería cargada correctamente\n";
echo "🔑 Secreto de prueba generado: " . $secret . "\n";
