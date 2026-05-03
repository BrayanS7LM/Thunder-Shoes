/**
 * main.js — Thunder Shoes
 * Carrito de compras.
 */

document.addEventListener('DOMContentLoaded', function () {

  // ── DOM ────────────────────────────────────────────────────
  var carritoEl     = document.getElementById('carrito');
  var contadorEl    = document.querySelector('.contador-items');
  var botonesAnadir = document.querySelectorAll('.boton');
  var botonCheckout = document.querySelector('.boton-checkout');

  // ── Estado ─────────────────────────────────────────────────
  var carritoAbierto = false;
  var carritoData    = cargarDesdeStorage();

  renderDropdown();

  // ── Abrir / cerrar dropdown ────────────────────────────────
  carritoEl.addEventListener('click', function (e) {
    if (e.target.closest('.carrito-dropdown') &&
        !e.target.classList.contains('boton-checkout')) return;
    carritoAbierto = !carritoAbierto;
    carritoEl.classList.toggle('active', carritoAbierto);
  });

  document.addEventListener('click', function (e) {
    if (!carritoEl.contains(e.target) && carritoAbierto) {
      carritoEl.classList.remove('active');
      carritoAbierto = false;
    }
  });

  // ── Botones "Añadir al carrito" ────────────────────────────
  botonesAnadir.forEach(function (boton) {
    boton.addEventListener('click', function () {

      var sesionRaw = localStorage.getItem('usuarioActivo');
      var usuarioActivo = null;
      if (sesionRaw) {
        try {
          var parsed = JSON.parse(sesionRaw);
          usuarioActivo = parsed;
        } catch (e) {
          usuarioActivo = { nombre: sesionRaw };
        }
      }

      if (!usuarioActivo) {
        mostrarAvisoLogin();
        return;
      }

      var galeria = this.closest('.galeria');

      var liNombre = galeria.querySelector('li:first-child');
      var nombre   = liNombre.querySelector('strong')
                      ? liNombre.querySelector('strong').textContent.trim()
                      : liNombre.textContent.trim();

      var precioTexto = galeria.querySelector('li:last-child').textContent;
      var precio      = parseInt(precioTexto.replace(/[^\d]/g, ''), 10) || 0;

      var idProducto = parseInt(boton.dataset.id || galeria.dataset.id) || null;

      agregarItem(idProducto, nombre, precio);

      var textoOriginal = boton.textContent;
      boton.textContent = '¡Agregado!';
      boton.disabled = true;
      setTimeout(function () {
        boton.textContent = textoOriginal;
        boton.disabled = false;
      }, 1500);
    });
  });

  // ── Finalizar compra ───────────────────────────────────────
  if (botonCheckout) {
    botonCheckout.addEventListener('click', function () {
      if (carritoData.length === 0) {
        alert('Tu carrito está vacío');
        return;
      }
      guardarEnStorage();
      var enPages = window.location.pathname.includes('/pages/');
      window.location.href = enPages ? 'pago.html' : 'pages/pago.html';
    });
  }

  // ════════════════════════════════════════════════════════════
  // LÓGICA
  // ════════════════════════════════════════════════════════════

  function agregarItem(idProducto, nombre, precio) {
    var existente = carritoData.find(function (it) {
      return it.nombre === nombre && it.precio === precio;
    });
    if (existente) {
      existente.cantidad += 1;
    } else {
      carritoData.push({ id_producto: idProducto, nombre: nombre, precio: precio, cantidad: 1 });
    }
    guardarEnStorage();
    renderDropdown();
    animarContador();
  }

  function eliminarItem(idx) {
    carritoData.splice(idx, 1);
    guardarEnStorage();
    renderDropdown();
  }

  function totalUnidades() {
    return carritoData.reduce(function (s, it) { return s + it.cantidad; }, 0);
  }

  function totalPesos() {
    return carritoData.reduce(function (s, it) { return s + it.precio * it.cantidad; }, 0);
  }

  function guardarEnStorage() {
    localStorage.setItem('carritoThunder', JSON.stringify(carritoData));
  }

  function cargarDesdeStorage() {
    try {
      var raw = localStorage.getItem('carritoThunder');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  // ── Modal aviso de login ───────────────────────────────────
  function mostrarAvisoLogin() {
    var previo = document.getElementById('modal-login-aviso');
    if (previo) previo.remove();

    var linkLogin = window.location.pathname.includes('/pages/')
      ? 'login.html'
      : 'pages/login.html';

    var modal = document.createElement('div');
    modal.id = 'modal-login-aviso';
    modal.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,0.5);z-index:9999;' +
      'display:flex;align-items:center;justify-content:center;';

    modal.innerHTML =
      '<div style="background:#fff;border-radius:12px;padding:40px 32px;' +
      'max-width:380px;width:90%;text-align:center;' +
      'box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
        '<div style="font-size:50px;margin-bottom:16px;">🔒</div>' + 
        '<p style="...">Debes iniciar sesión primero para poder comprar tus Thunder Shoes.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;">' +
          '<a href="' + linkLogin + '" ' +
          'style="background:#011526;color:#fff;padding:11px 24px;border-radius:6px;' +
          'text-decoration:none;font-size:14px;font-weight:600;">Iniciar sesión</a>' +
          '<button onclick="document.getElementById(\'modal-login-aviso\').remove()" ' +
          'style="background:#f0f0f0;color:#333;padding:11px 24px;border-radius:6px;' +
          'border:none;cursor:pointer;font-size:14px;font-weight:600;">Cancelar</button>' +
        '</div>' +
      '</div>';

    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  // ── Render dropdown ────────────────────────────────────────
  function renderDropdown() {
    var contenedor = document.querySelector('.carrito-items');
    var totalSpan  = document.querySelector('.carrito-total span:last-child');
    if (!contenedor) return;

    if (contadorEl) contadorEl.textContent = totalUnidades();
    contenedor.innerHTML = '';

    if (carritoData.length === 0) {
      var vacio = document.createElement('div');
      vacio.className = 'carrito-vacio';
      vacio.textContent = 'Tu carrito está vacío';
      contenedor.appendChild(vacio);
      if (totalSpan) totalSpan.textContent = '$0';
      return;
    }

    carritoData.forEach(function (item, idx) {
      var div = document.createElement('div');
      div.className = 'carrito-item';
      div.innerHTML =
        '<span>' + item.nombre + ' x' + item.cantidad + '</span>' +
        '<span>$' + (item.precio * item.cantidad).toLocaleString('es-CO') + '</span>' +
        '<button class="btn-eliminar" data-idx="' + idx + '">X</button>';

      div.querySelector('.btn-eliminar').addEventListener('click', function (e) {
        e.stopPropagation();
        eliminarItem(parseInt(this.dataset.idx));
      });
      contenedor.appendChild(div);
    });

    if (totalSpan) totalSpan.textContent = '$' + totalPesos().toLocaleString('es-CO');
  }

  function animarContador() {
    if (!contadorEl) return;
    contadorEl.style.transform = 'scale(1.5)';
    setTimeout(function () { contadorEl.style.transform = 'scale(1)'; }, 180);
  }

});
