/**
 * pago.js — Thunder Shoes
 * Pasarela de pagos en 3 fases (pago simulado).
 */

// ── Estado global ──────────────────────────────────────────────
var metodoPago   = '';
var carritoItems = [];
var totalCompra  = 0;

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  carritoItems = leerCarrito();

  if (carritoItems.length === 0) {
    mostrarCarritoVacio();
    return;
  }

  renderResumen();

  // Pre-rellenar datos del usuario si hay sesión activa
  var rawUsuario = localStorage.getItem('usuarioActivo');
  if (rawUsuario) {
    var usr = null;
    try { usr = JSON.parse(rawUsuario); } catch (e) { usr = { nombre: rawUsuario }; }
    if (usr) {
      if (usr.nombre)   g('f1-nombre').value   = usr.nombre;
      if (usr.email)    g('f1-email').value     = usr.email;
      if (usr.telefono) g('f1-telefono').value  = usr.telefono;
    }
  }
});

// ── Helpers ────────────────────────────────────────────────────
function g(id)  { return document.getElementById(id); }
function fmt(n) { return '$' + Number(n).toLocaleString('es-CO'); }

function leerCarrito() {
  try {
    var raw  = localStorage.getItem('carritoThunder');
    var data = raw ? JSON.parse(raw) : [];
    return data
      .filter(function (it) { return it.nombre && it.precio > 0; })
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

  var resSubtotal = g('res-subtotal');
  var resTotal    = g('res-total');
  var btnLabel    = g('btn-total-label');

  if (resSubtotal) resSubtotal.textContent = fmt(totalCompra);
  if (resTotal)    resTotal.textContent    = fmt(totalCompra);
  if (btnLabel)    btnLabel.textContent    = fmt(totalCompra);
}

// ── Stepper ────────────────────────────────────────────────────
function setStep(n) {
  [1, 2, 3].forEach(function (i) {
    var s  = g('s' + i);
    var ph = g('fase' + i);
    if (!s) return;
    s.classList.remove('active', 'done');
    if (ph) ph.classList.remove('active');
    if (i < n)   s.classList.add('done');
    if (i === n) { s.classList.add('active'); if (ph) ph.classList.add('active'); }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── FASE 1 → 2 ────────────────────────────────────────────────
function irFase1() { setStep(1); }

function irFase2() {
  var err = g('err1');
  err.classList.remove('show');

  var nombre = g('f1-nombre').value.trim();
  var email  = g('f1-email').value.trim();
  var ciudad = g('f1-ciudad').value;
  var talla  = g('f1-talla').value;
  var dir    = g('f1-direccion').value.trim();

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

// ── FASE 2: Selección método de pago ──────────────────────────
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
    .split('').map(function (c, i) {
      return i < digits.length ? digits[i] : '•';
    }).join('').replace(/(.{4})/g, '$1 ').trim();
  g('vis-num').textContent = masked || '•••• •••• •••• ••••';
}

function formatExp(input) {
  var raw = input.value.replace(/\D/g, '').slice(0, 4);
  if (raw.length >= 3) raw = raw.slice(0, 2) + '/' + raw.slice(2);
  input.value = raw;
  g('vis-exp').textContent = raw || 'MM/AA';
}

// ── Procesar pago ──────────────────────────────────────────────
function procesarPago() {
  var err2 = g('err2');
  err2.classList.remove('show');

  // Validar que se seleccionó un método
  if (!metodoPago) {
    err2.querySelector('span').textContent = 'Selecciona un método de pago para continuar.';
    err2.classList.add('show');
    return;
  }

  // Validación mínima por método (simulado: solo campos visibles básicos)
  if (metodoPago === 'pse' && !g('pse-banco').value) {
    err2.querySelector('span').textContent = 'Selecciona tu banco para continuar con PSE.';
    err2.classList.add('show');
    return;
  }

  if (metodoPago === 'nequi' && !g('nequi-num').value.trim()) {
    err2.querySelector('span').textContent = 'Ingresa tu número de celular Nequi.';
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

  // Construir payload
  var payload = {
    nombre:          g('f1-nombre').value.trim(),
    email:           g('f1-email').value.trim(),
    telefono:        g('f1-telefono').value.trim(),
    ciudad_envio:    g('f1-ciudad').value,
    talla:           g('f1-talla').value,
    direccion_envio: g('f1-direccion').value.trim(),
    metodo_pago:     metodoPago,
    valor_total:     totalCompra,
    items: carritoItems.map(function (it) {
      return {
        id_producto:     it.id_producto || null,
        nombre:          it.nombre,
        cantidad:        it.cantidad,
        precio_unitario: it.precio
      };
    })
  };

  // Datos tarjeta
  if (metodoPago === 'tarjeta_credito' || metodoPago === 'tarjeta_debito') {
    payload.tarjeta_numero  = g('t-num').value.replace(/\s/g, '');
    payload.tarjeta_titular = g('t-nombre').value.trim();
    payload.tarjeta_vence   = g('t-exp').value;
    payload.tarjeta_cuotas  = parseInt(g('t-cuotas').value) || 1;
  }

  // Datos PSE
  if (metodoPago === 'pse') {
    payload.pse_banco        = g('pse-banco').value;
    payload.pse_tipo_persona = g('pse-tipo').value;
    payload.pse_tipo_doc     = g('pse-doc').value;
    payload.pse_numero_doc   = g('pse-num').value.trim();
  }

  // Enviar al PHP
  fetch('/php/procesarPago.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    clearInterval(iv);
    g('loader').classList.remove('show');

    if (data.success) {
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

  g('conf-ref').textContent    = data.referencia || 'N/A';
  g('conf-nombre').textContent = payload.nombre;
  g('conf-dir').textContent    = payload.direccion_envio + ', ' + payload.ciudad_envio;
  g('conf-metodo').textContent = etiquetas[metodoPago] || metodoPago;
  g('conf-total').textContent  = fmt(payload.valor_total);

  g('s2').classList.remove('active');
  g('s2').classList.add('done');
  g('s3').classList.add('active');
  g('fase3').classList.add('active');
}
