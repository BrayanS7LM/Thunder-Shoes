/**
 * main.js — Thunder Shoes
 * Carrito de compras.
 * Guarda en localStorage['carritoThunder'] con la estructura:
 * [{ id_producto, nombre, precio, cantidad }]
 * que leen pago.js y procesarPago.php
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

  renderDropdown(); // pintar lo que haya guardado al entrar

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
      var galeria = this.closest('.galeria');

      // Nombre del producto
      var liNombre = galeria.querySelector('li:first-child');
      var nombre   = liNombre.querySelector('strong')
                      ? liNombre.querySelector('strong').textContent.trim()
                      : liNombre.textContent.trim();

      // Precio (solo dígitos del último <li>)
      var precioTexto = galeria.querySelector('li:last-child').textContent;
      var precio      = parseInt(precioTexto.replace(/[^\d]/g, ''), 10) || 0;

      // id_producto desde data-id del boton o galeria (agrega data-id="X" al HTML para conectar con la BD)
      var idProducto = parseInt(boton.dataset.id || galeria.dataset.id) || null;

      agregarItem(idProducto, nombre, precio);

      // Feedback sin alert bloqueante
      var textoOriginal = boton.textContent;
      boton.textContent = 'Agregado';
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
      window.location.href = '../pages/pago.html';
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