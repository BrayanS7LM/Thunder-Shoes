/**
 * main.js — Thunder Shoes
 * Carrito de compras.
 * Guarda en localStorage['carritoThunder'] con la estructura:
 * [{ id_producto, nombre, precio, cantidad }]
 * que leen pago.js y procesarPago.php
 *
 * CAMBIOS:
 *  1. Verificar sesión activa antes de añadir al carrito.
 *  2. Si no hay sesión, mostrar mensaje en el dropdown invitando a iniciar sesión.
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

      // ── VERIFICAR SESIÓN ACTIVA ────────────────────────────
      // login.js guarda el nombre como string plano: localStorage.setItem("usuarioActivo", nombre)
      // Se maneja tanto string plano como objeto JSON por compatibilidad
      var sesionRaw = localStorage.getItem('usuarioActivo');
      var usuarioActivo = null;
      if (sesionRaw) {
        try {
          var parsed = JSON.parse(sesionRaw);
          usuarioActivo = parsed;
        } catch (e) {
          usuarioActivo = { nombre: sesionRaw }; // string plano "Juan" -> hay sesion activa
        }
      }

      if (!usuarioActivo) {
        // Abrir el dropdown y mostrar aviso de login
        carritoAbierto = true;
        carritoEl.classList.add('active');
        mostrarAvisoLogin();
        return; // No agregar al carrito
      }
      // ──────────────────────────────────────────────────────

      var galeria = this.closest('.galeria');

      // Nombre del producto
      var liNombre = galeria.querySelector('li:first-child');
      var nombre   = liNombre.querySelector('strong')
                      ? liNombre.querySelector('strong').textContent.trim()
                      : liNombre.textContent.trim();

      // Precio (solo dígitos del último <li>)
      var precioTexto = galeria.querySelector('li:last-child').textContent;
      var precio      = parseInt(precioTexto.replace(/[^\d]/g, ''), 10) || 0;

      // id_producto desde data-id del boton o galeria
      var idProducto = parseInt(boton.dataset.id || galeria.dataset.id) || null;

      agregarItem(idProducto, nombre, precio);

      // Feedback sin alert bloqueante
      var textoOriginal = boton.textContent;
      boton.textContent = '¡Agregado!';
      boton.disabled = true;
      setTimeout(function () {
        boton.textContent = textoOriginal;
        boton.disabled = false;
      }, 1500);
    });
  });

  // ── Finalizar compra → pasarela de pago ───────────────────
  if (botonCheckout) {
    botonCheckout.addEventListener('click', function () {
      if (carritoData.length === 0) {
        alert('Tu carrito está vacío');
        return;
      }
      guardarEnStorage();
      // Detectar si estamos en /pages/ o en la raíz para usar la ruta correcta
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

  // ── localStorage ───────────────────────────────────────────
  function guardarEnStorage() {
    localStorage.setItem('carritoThunder', JSON.stringify(carritoData));
  }

  function cargarDesdeStorage() {
    try {
      var raw = localStorage.getItem('carritoThunder');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  // ── Aviso de login en el dropdown ─────────────────────────
  function mostrarAvisoLogin() {
    var contenedor = document.querySelector('.carrito-items');
    var totalSpan  = document.querySelector('.carrito-total span:last-child');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    var aviso = document.createElement('div');
    aviso.className = 'carrito-vacio';
    aviso.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px 0;';
    aviso.innerHTML =
      '<span style="font-size:28px">🔒</span>' +
      '<span style="font-weight:600;color:#333">Inicia sesión para comprar</span>' +
      '<span style="font-size:13px;color:#777;text-align:center">Debes tener una cuenta activa para agregar productos al carrito.</span>' +
      '<a href="pages/login.html" style="' +
        'margin-top:6px;padding:9px 22px;background:#000;color:#fff;' +
        'border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;' +
        'transition:background 0.2s;" ' +
        'onmouseover="this.style.background=\'#333\'" ' +
        'onmouseout="this.style.background=\'#000\'">Iniciar sesión</a>';
    contenedor.appendChild(aviso);
    if (totalSpan) totalSpan.textContent = '$0';
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
