/**
 * pago.js — Thunder Shoes
 * Pasarela de pagos en 3 fases.
 * Lee el carrito desde localStorage['carritoThunder'] guardado por main.js.
 * Al confirmar, llama a procesarPago.php que inserta en OrdenCliente + DetalleOrden.
 */

// ── Estado global ──────────────────────────────────────────────
var metodoPago   = '';
var carritoItems = [];   // [{id_producto, nombre, precio, cantidad}]
var totalCompra  = 0;

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // 1. Leer carrito real desde localStorage (guardado por main.js)
  carritoItems = leerCarrito();

  // 2. Si viene vacío, mostrar aviso y no dejar continuar
  if (carritoItems.length === 0) {
    mostrarCarritoVacio();
    return;
  }

  // 3. Pintar resumen lateral
  renderResumen();

  // 4. Pre-rellenar datos del usuario si hay sesión activa
  var rawUsuario = localStorage.getItem('usuarioActivo');
  if (rawUsuario) {
    try {
      var usr = JSON.parse(rawUsuario);
      if (usr.nombre)   g('f1-nombre').value   = usr.nombre;
      if (usr.email)    g('f1-email').value    = usr.email;
      if (usr.telefono) g('f1-telefono').value = usr.telefono;
    } catch (e) {}
  }
});

// ── Helpers ────────────────────────────────────────────────────
function g(id)  { return document.getElementById(id); }
function fmt(n) { return '$' + Number(n).toLocaleString('es-CO'); }

function leerCarrito() {
  try {
    var raw = localStorage.getItem('carritoThunder');
    var data = raw ? JSON.parse(raw) : [];
    // Asegurar que cada item tenga cantidad >= 1
    return data.filter(function (it) { return it.nombre && it.precio > 0; })
               .map(function (it) {
                 it.cantidad = parseInt(it.cantidad) || 1;
                 return it;
               });
  } catch (e) { return []; }
}

function mostrarCarritoVacio() {
  var col = document.querySelector('.page > div');
  if (col) {
    col.innerHTML =
      '<div class="card" style="text-align:center;padding:48px 32px">' +
        '<div style="font-size:48px;margin-bottom:16px">🛒</div>' +
        '<h2 style="color:var(--green);font-family:Montserrat,sans-serif;margin-bottom:12px">Tu carrito está vacío</h2>' +
        '<p style="color:var(--muted);margin-bottom:28px">Agrega productos antes de continuar al pago.</p>' +
        '<a href="../pages/cliente.html" class="btn btn-primary" style="display:inline-flex;width:auto;padding:14px 32px">Ver productos</a>' +
      '</div>';
  }
  // Ocultar resumen lateral también
  var aside = document.querySelector('.resumen-sticky');
  if (aside) aside.style.display = 'none';
}

// ── Render resumen lateral ─────────────────────────────────────
function renderResumen() {
  var lista = g('lista-items');
  if (!lista) return;
  lista.innerHTML = '';
  totalCompra = 0;

  carritoItems.forEach(function (it) {
    var sub = it.precio * it.cantidad;
    totalCompra += sub;

    var div = document.createElement('div');
    div.className = 'item-line';
    div.innerHTML =
      '<span class="item-dot"></span>' +
      '<span class="item-name">' + it.nombre + '</span>' +
      '<span class="item-qty">x' + it.cantidad + '</span>' +
      '<span class="item-price">' + fmt(sub) + '</span>';
    lista.appendChild(div);
  });

  // Totales
  g('res-subtotal').textContent = fmt(totalCompra);
  g('res-total').textContent    = fmt(totalCompra);

  // Actualizar label del botón de pagar
  var btnLabel = g('btn-total-label');
  if (btnLabel) btnLabel.textContent = fmt(totalCompra);
}

// ── Stepper ────────────────────────────────────────────────────
function setStep(n) {
  [1, 2, 3].forEach(function (i) {
    var s  = g('s' + i);
    var ph = g('fase' + i);
    s.classList.remove('active', 'done');
    if (ph) ph.classList.remove('active');
    if (i < n)   s.classList.add('done');
    if (i === n) { s.classList.add('active'); if (ph) ph.classList.add('active'); }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── FASE 1 → 2: Validar datos de envío ────────────────────────
function irFase1() { setStep(1); }

function irFase2() {
  var err = g('err1');
  err.classList.remove('show');

  var nombre   = g('f1-nombre').value.trim();
  var email    = g('f1-email').value.trim();
  var ciudad   = g('f1-ciudad').value;
  var talla    = g('f1-talla').value;
  var dir      = g('f1-direccion').value.trim();

  if (!nombre || !email || !ciudad || !talla || !dir) {
    err.querySelector('span').textContent = 'Completa todos los campos obligatorios.';
    err.classList.add('show');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    err.querySelector('span').textContent = 'Ingresa un correo electrónico válido.';
    err.classList.add('show');
    return;
  }
  setStep(2);
}

// ── FASE 2: Selección de método de pago ───────────────────────
function seleccionarMetodo(btn) {
  document.querySelectorAll('.metodo-btn').forEach(function (b) {
    b.classList.remove('selected');
  });
  btn.classList.add('selected');
  metodoPago = btn.dataset.metodo;

  ['tarjeta', 'nequi', 'pse', 'efecty'].forEach(function (f) {
    var el = g('form-' + f);
    if (el) el.style.display = 'none';
  });

  var mapa = {
    tarjeta_credito: 'tarjeta',
    tarjeta_debito:  'tarjeta',
    nequi:           'nequi',
    pse:             'pse',
    efecty:          'efecty'
  };
  if (mapa[metodoPago]) g('form-' + mapa[metodoPago]).style.display = 'block';
}

// ── Formateo visual tarjeta ────────────────────────────────────
function formatCardNum(input) {
  var digits = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = digits.replace(/(.{4})/g, '$1 ').trim();
  var masked = (digits + '################').slice(0, 16)
    .split('').map(function (c, i) { return i < digits.length ? digits[i] : '•'; })
    .join('').replace(/(.{4})/g, '$1 ').trim();
  g('vis-num').textContent = masked || '•••• •••• •••• ••••';
}

function formatExp(input) {
  var raw = input.value.replace(/\D/g, '').slice(0, 4);
  if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2);
  input.value = raw;
  g('vis-exp').textContent = raw || 'MM/AA';
}

// ── Procesar pago → PHP → BD ───────────────────────────────────
function procesarPago() {
  var err2 = g('err2');
  err2.classList.remove('show');

  // Validar método
  if (!metodoPago) {
    err2.querySelector('span').textContent = 'Selecciona un método de pago para continuar.';
    err2.classList.add('show');
    return;
  }

  // Validar tarjeta
  if (metodoPago === 'tarjeta_credito' || metodoPago === 'tarjeta_debito') {
    var num = g('t-num').value.replace(/\s/g, '');
    var exp = g('t-exp').value;
    var cvv = g('t-cvv').value;
    var nom = g('t-nombre').value.trim();
    if (num.length < 16 || !exp.includes('/') || cvv.length < 3 || !nom) {
      err2.querySelector('span').textContent = 'Completa correctamente los datos de la tarjeta.';
      err2.classList.add('show');
      return;
    }
  }

  // Validar Nequi
  if (metodoPago === 'nequi' && !g('nequi-num').value.trim()) {
    err2.querySelector('span').textContent = 'Ingresa tu número de celular Nequi.';
    err2.classList.add('show');
    return;
  }

  // Validar PSE
  if (metodoPago === 'pse' && !g('pse-banco').value) {
    err2.querySelector('span').textContent = 'Selecciona tu banco para continuar con PSE.';
    err2.classList.add('show');
    return;
  }

  // Mostrar loader
  g('fase2').classList.remove('active');
  g('loader').classList.add('show');

  var msgs = [
    'Verificando datos...',
    'Conectando con el banco...',
    'Procesando el pago...',
    'Generando tu pedido...'
  ];
  var mi = 0;
  var iv = setInterval(function () {
    g('loader-msg').textContent = msgs[Math.min(mi++, msgs.length - 1)];
  }, 900);

  // ── Payload que recibe procesarPago.php 
  // Sigue exactamente el diagrama ER:
  //   OrdenCliente: id_usuario, ciudad_envio, direccion_envio, metodo_pago, valor_total
  //   DetalleOrden: id_orden, id_producto, cantidad, precio_unitario
  var payload = {
    // Datos del usuario / envío (Fase 1)
    nombre:    g('f1-nombre').value.trim(),
    email:     g('f1-email').value.trim(),
    telefono:  g('f1-telefono').value.trim(),
    ciudad_envio:    g('f1-ciudad').value,
    talla:           g('f1-talla').value,
    direccion_envio: g('f1-direccion').value.trim(),
    // Datos del pago (Fase 2)
    metodo_pago: metodoPago,
    valor_total: totalCompra,
    // Items del carrito → DetalleOrden
    items: carritoItems.map(function (it) {
      return {
        id_producto:     it.id_producto || null,
        nombre:          it.nombre,
        cantidad:        it.cantidad,
        precio_unitario: it.precio
      };
    })
  };

  fetch('../php/procesarPago.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    clearInterval(iv);
    g('loader').classList.remove('show');

    if (data.success) {
      // Limpiar carrito del localStorage
      localStorage.removeItem('carritoThunder');
      mostrarConfirmacion(data, payload);
    } else {
      g('fase2').classList.add('active');
      err2.querySelector('span').textContent =
        data.mensaje || 'Error al procesar el pago. Intenta de nuevo.';
      err2.classList.add('show');
    }
  })
  .catch(function () {
    clearInterval(iv);
    g('loader').classList.remove('show');
    g('fase2').classList.add('active');
    err2.querySelector('span').textContent =
      'Error de conexión. Verifica tu internet e intenta de nuevo.';
    err2.classList.add('show');
  });
}

// ── FASE 3: Confirmación ───────────────────────────────────────
function mostrarConfirmacion(data, payload) {
  var etiquetas = {
    tarjeta_credito: 'Tarjeta de Crédito',
    tarjeta_debito:  'Tarjeta de Débito',
    nequi:           'Nequi',
    pse:             'PSE',
    efecty:          'Efecty'
  };

  g('conf-ref').textContent    = data.referencia    || 'N/A';
  g('conf-nombre').textContent = payload.nombre;
  g('conf-dir').textContent    = payload.direccion_envio + ', ' + payload.ciudad_envio;
  g('conf-metodo').textContent = etiquetas[metodoPago] || metodoPago;
  g('conf-total').textContent  = fmt(payload.valor_total);

  // Avanzar stepper al paso 3
  g('s2').classList.remove('active');
  g('s2').classList.add('done');
  g('s3').classList.add('active');
  g('fase3').classList.add('active');
}