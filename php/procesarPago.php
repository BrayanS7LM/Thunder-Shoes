<?php
ob_start(); // Captura cualquier output inesperado
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'mensaje' => 'JSON inválido']);
    exit;
}

// Validar campos obligatorios
$requeridos = ['nombre', 'email', 'ciudad_envio', 'talla',
               'direccion_envio', 'metodo_pago', 'valor_total', 'items'];
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

// Calcular total en el servidor
$total = 0.0;
foreach ($data['items'] as $item) {
    $total += floatval($item['precio_unitario']) * intval($item['cantidad']);
}

$referencia = 'TS-' . strtoupper(substr(md5(uniqid()), 0, 10));

$conexion->begin_transaction();

try {
    // 1. Insertar OrdenCliente
    // Usamos id_usuario = 1 fijo para pruebas (luego lo conectamos a sesión)
    $id_usuario = 1;
    $subtotal   = $total;
    $envio      = 0.00;
    $telefono   = $data['telefono'] ?? '';
    $nombre     = $data['nombre'];
    $email      = $data['email'];
    $ciudad     = $data['ciudad_envio'];
    $talla      = $data['talla'];
    $dir        = $data['direccion_envio'];

    $stmt = $conexion->prepare(
        'INSERT INTO OrdenCliente
           (id_usuario, nombre_envio, email_envio, telefono_envio,
            ciudad_envio, talla_envio, direccion_envio,
            subtotal, envio, valor_total, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pagado")'
    );
    $stmt->bind_param('issssssdd' . 'd',
        $id_usuario,
        $nombre, $email, $telefono,
        $ciudad, $talla, $dir,
        $subtotal, $envio, $total
    );
    $stmt->execute();
    $id_orden = (int) $conexion->insert_id;
    $stmt->close();

    // 2. Insertar PagoOrden
    $metodo        = $data['metodo_pago'];
    $pse_banco     = $data['pse_banco']        ?? null;
    $pse_tipo_pers = $data['pse_tipo_persona'] ?? null;
    $pse_tipo_doc  = $data['pse_tipo_doc']     ?? null;
    $pse_num_doc   = $data['pse_numero_doc']   ?? null;
    $tar_numero    = $data['tarjeta_numero']   ?? null;
    $tar_titular   = $data['tarjeta_titular']  ?? null;
    $tar_vence     = $data['tarjeta_vence']    ?? null;
    $tar_cuotas    = isset($data['tarjeta_cuotas']) ? (int)$data['tarjeta_cuotas'] : null;

    $stmt2 = $conexion->prepare(
        'INSERT INTO PagoOrden
           (id_orden, metodo_pago, estado_pago,
            pse_banco, pse_tipo_persona, pse_tipo_doc, pse_numero_doc,
            tarjeta_numero, tarjeta_titular, tarjeta_vence, tarjeta_cuotas)
         VALUES (?, ?, "aprobado", ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt2->bind_param('issssssssi',
        $id_orden, $metodo,
        $pse_banco, $pse_tipo_pers, $pse_tipo_doc, $pse_num_doc,
        $tar_numero, $tar_titular, $tar_vence, $tar_cuotas
    );
    $stmt2->execute();
    $stmt2->close();

    // 3. Insertar DetalleOrden
    $stmt3 = $conexion->prepare(
        'INSERT INTO DetalleOrden (id_orden, id_producto, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)'
    );
    foreach ($data['items'] as $item) {
        $id_prod = !empty($item['id_producto']) ? (int)$item['id_producto'] : null;
        $cant    = max(1, (int)$item['cantidad']);
        $precio  = floatval($item['precio_unitario']);
        $stmt3->bind_param('iiid', $id_orden, $id_prod, $cant, $precio);
        $stmt3->execute();
    }
    $stmt3->close();

    $conexion->commit();

    ob_end_clean(); // Limpiar cualquier output antes del JSON
    echo json_encode([
        'success'    => true,
        'referencia' => $referencia,
        'id_orden'   => $id_orden,
        'total'      => $total
    ]);

} catch (Exception $e) {
    $conexion->rollback();
    ob_end_clean();
    error_log('[ThunderShoes] ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'mensaje' => 'Error: ' . $e->getMessage()
    ]);
} finally {
    $conexion->close();
}
