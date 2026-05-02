<?php


header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

// ── Leer body JSON 
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data) {
    echo json_encode(['success' => false, 'mensaje' => 'JSON inválido']);
    exit;
}

// ── Validar campos obligatorio
$requeridos = ['nombre', 'email', 'ciudad_envio', 'direccion_envio',
               'metodo_pago', 'valor_total', 'items'];
foreach ($requeridos as $campo) {
    if (empty($data[$campo])) {
        echo json_encode(['success' => false, 'mensaje' => "Campo requerido: $campo"]);
        exit;
    }
}

if (!is_array($data['items']) || count($data['items']) === 0) {
    echo json_encode(['success' => false, 'mensaje' => 'El carrito está vacío']);
    exit;
}

$metodosValidos = ['tarjeta_credito', 'tarjeta_debito', 'nequi', 'pse', 'efecty'];
if (!in_array($data['metodo_pago'], $metodosValidos)) {
    echo json_encode(['success' => false, 'mensaje' => 'Método de pago no válido']);
    exit;
}

// ── Conexión BD (reutiliza conexion.php del proyecto) ──────────
require_once __DIR__ . '/conexion.php';
// conexion.php debe dejar $pdo disponible (PDO con MariaDB)

try {

    // 1. USUARIO
    //    Buscar por email. Si no existe, crearlo.
    //    (El flujo normal es: ya inició sesión, así que existe)
    // ══════════════════════════════════════════════════════════
    $stmt = $pdo->prepare(
        'SELECT id_usuario FROM Usuario WHERE email = :email LIMIT 1'
    );
    $stmt->execute([':email' => $data['email']]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario) {
        $id_usuario = (int) $usuario['id_usuario'];

        // Actualizar teléfono si llegó y estaba vacío
        if (!empty($data['telefono'])) {
            $pdo->prepare(
                "UPDATE Usuario SET telefono = :tel
                  WHERE id_usuario = :id
                    AND (telefono IS NULL OR telefono = '')"
            )->execute([':tel' => $data['telefono'], ':id' => $id_usuario]);
        }
    } else {
        // Crear usuario mínimo (sin contraseña real — flujo solo si no existe)
        $pdo->prepare(
            'INSERT INTO Usuario (nombre, email, password, telefono)
             VALUES (:nombre, :email, :pwd, :tel)'
        )->execute([
            ':nombre' => $data['nombre'],
            ':email'  => $data['email'],
            ':pwd'    => password_hash(bin2hex(random_bytes(8)), PASSWORD_BCRYPT),
            ':tel'    => $data['telefono'] ?? null
        ]);
        $id_usuario = (int) $pdo->lastInsertId();
    }

    // ══════════════════════════════════════════════════════════
    // 2. CALCULAR TOTAL DESDE EL SERVIDOR
    //    No confiar ciegamente en el valor que mandó el cliente
    // ══════════════════════════════════════════════════════════
    $valor_calculado = 0.0;
    foreach ($data['items'] as $item) {
        $valor_calculado += floatval($item['precio_unitario']) * intval($item['cantidad']);
    }
    // Tolerancia de 1 COP por posibles redondeos
    if (abs($valor_calculado - floatval($data['valor_total'])) > 1) {
        echo json_encode([
            'success' => false,
            'mensaje' => 'El total no coincide con los productos. Recarga la página.'
        ]);
        exit;
    }

    // ══════════════════════════════════════════════════════════
    // 3. INICIAR TRANSACCIÓN
    // ══════════════════════════════════════════════════════════
    $pdo->beginTransaction();

    // ══════════════════════════════════════════════════════════
    // 4. INSERTAR OrdenCliente
    //    Campos del diagrama ER:
    //    id_orden (AUTO), id_usuario (FK), fecha (NOW),
    //    metodo_pago, valor_total,
    //    ciudad_envio, direccion_envio
    //    + extras: estado_pago, referencia_pago, fecha_pago
    // ══════════════════════════════════════════════════════════
    $referencia = 'TS-' . strtoupper(substr(md5(uniqid($id_usuario . time(), true)), 0, 10));

    $pdo->prepare(
        'INSERT INTO OrdenCliente
           (id_usuario, fecha, metodo_pago, valor_total,
            ciudad_envio, direccion_envio,
            estado_pago, referencia_pago, fecha_pago)
         VALUES
           (:uid, NOW(), :metodo, :total,
            :ciudad, :dir,
            :estado, :ref, NOW())'
    )->execute([
        ':uid'    => $id_usuario,
        ':metodo' => $data['metodo_pago'],
        ':total'  => $valor_calculado,
        ':ciudad' => $data['ciudad_envio'],
        ':dir'    => $data['direccion_envio'],
        ':estado' => 'aprobado',
        ':ref'    => $referencia
    ]);

    $id_orden = (int) $pdo->lastInsertId();

    // ══════════════════════════════════════════════════════════
    // 5. INSERTAR DetalleOrden por cada producto
    //    Campos del diagrama ER:
    //    id_detalle (AUTO), id_orden (FK), id_producto (FK),
    //    cantidad, precio_unitario
    // ══════════════════════════════════════════════════════════
    $stmtDetalle = $pdo->prepare(
        'INSERT INTO DetalleOrden
           (id_orden, id_producto, cantidad, precio_unitario)
         VALUES
           (:id_orden, :id_producto, :cantidad, :precio)'
    );

    foreach ($data['items'] as $item) {
        $id_producto     = !empty($item['id_producto']) ? (int) $item['id_producto'] : null;
        $cantidad        = max(1, (int) $item['cantidad']);
        $precio_unitario = floatval($item['precio_unitario']);

        // Si el producto tiene id, verificar stock y descontarlo
        if ($id_producto) {
            $stmtProd = $pdo->prepare(
                'SELECT stock FROM Producto WHERE id_producto = :id FOR UPDATE'
            );
            $stmtProd->execute([':id' => $id_producto]);
            $prod = $stmtProd->fetch(PDO::FETCH_ASSOC);

            if (!$prod) {
                $pdo->rollBack();
                echo json_encode([
                    'success' => false,
                    'mensaje' => 'El producto #' . $id_producto . ' no existe.'
                ]);
                exit;
            }
            if ((int) $prod['stock'] < $cantidad) {
                $pdo->rollBack();
                echo json_encode([
                    'success' => false,
                    'mensaje' => 'Stock insuficiente para "' . htmlspecialchars($item['nombre']) . '".'
                ]);
                exit;
            }
            // Descontar stock
            $pdo->prepare(
                'UPDATE Producto SET stock = stock - :cant WHERE id_producto = :id'
            )->execute([':cant' => $cantidad, ':id' => $id_producto]);
        }

        $stmtDetalle->execute([
            ':id_orden'    => $id_orden,
            ':id_producto' => $id_producto,
            ':cantidad'    => $cantidad,
            ':precio'      => $precio_unitario
        ]);
    }

    // ══════════════════════════════════════════════════════════
    // 6. CONFIRMAR TRANSACCIÓN
    // ══════════════════════════════════════════════════════════
    $pdo->commit();

    // ══════════════════════════════════════════════════════════
    // 7. RESPUESTA EXITOSA
    // ══════════════════════════════════════════════════════════
    echo json_encode([
        'success'    => true,
        'mensaje'    => 'Pago procesado correctamente',
        'referencia' => $referencia,
        'id_orden'   => $id_orden,
        'id_usuario' => $id_usuario,
        'total'      => $valor_calculado
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('[Thunder Shoes] Error BD: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error interno del servidor. Intenta de nuevo.'
    ]);
}