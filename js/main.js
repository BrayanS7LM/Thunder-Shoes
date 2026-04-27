document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const carrito = document.getElementById('carrito');
    const contadorItems = document.querySelector('.contador-items');
    const botonesAñadir = document.querySelectorAll('.boton');
    const botonCheckout = document.querySelector('.boton-checkout');
    
    // Variables
    let carritoAbierto = false;
    let cantidadTotal = 0;
    
    // Abrir/cerrar el carrito al hacer clic
    carrito.addEventListener('click', function(e) {
        // No cerrar si se hace clic dentro del dropdown (excepto en checkout)
        if (e.target.closest('.carrito-dropdown') && 
            !e.target.classList.contains('boton-checkout')) {
            return;
        }
        
        carritoAbierto = !carritoAbierto;
        if (carritoAbierto) {
            carrito.classList.add('active');
        } else {
            carrito.classList.remove('active');
        }
    });
    
    // Cerrar el carrito si se hace clic fuera de él
    document.addEventListener('click', function(e) {
        if (!carrito.contains(e.target) && carritoAbierto) {
            carrito.classList.remove('active');
            carritoAbierto = false;
        }
    });
    
    // Añadir evento a todos los botones "Añadir al carrito"
    botonesAñadir.forEach(function(boton) {
        boton.addEventListener('click', function() {
            // Obtener información del producto
            const galeria = this.closest('.galeria');
            const nombreProducto = galeria.querySelector('li:first-child').textContent;
            const precioTexto = galeria.querySelector('li:last-child').textContent;
            const precio = parseFloat(precioTexto.replace(/[^\d.]/g, ''));
            
            // Añadir al carrito
            añadirAlCarrito(nombreProducto, precio);
            
            // Alerta simple para confirmar
            alert(nombreProducto + " añadido al carrito");
        });
    });
    
    // Finalizar compra
    if (botonCheckout) {
        botonCheckout.addEventListener('click', function() {
            if (cantidadTotal > 0) {
                alert('¡Gracias por tu compra!');
                vaciarCarrito();
            } else {
                alert('Tu carrito está vacío');
            }
        });
    }
    
    // Función para añadir productos al carrito
    function añadirAlCarrito(producto, precio) {
        // Actualizar contador
        cantidadTotal++;
        contadorItems.textContent = cantidadTotal;
        
        // Eliminar mensaje de carrito vacío si existe
        const carritoVacio = document.querySelector('.carrito-vacio');
        if (carritoVacio) {
            carritoVacio.remove();
        }
        
        // Crear elemento del carrito
        const carritoItems = document.querySelector('.carrito-items');
        const nuevoItem = document.createElement('div');
        nuevoItem.classList.add('carrito-item');
        nuevoItem.innerHTML = `
            <span>${producto}</span>
            <span>$${precio.toFixed(2)}</span>
            <button class="btn-eliminar">X</button>
        `;
        carritoItems.appendChild(nuevoItem);
        
        // Añadir evento para eliminar
        const botonEliminar = nuevoItem.querySelector('.btn-eliminar');
        botonEliminar.addEventListener('click', function() {
            nuevoItem.remove();
            cantidadTotal--;
            contadorItems.textContent = cantidadTotal;
            
            // Si no hay items, mostrar mensaje de carrito vacío
            if (cantidadTotal === 0) {
                const carritoVacio = document.createElement('div');
                carritoVacio.classList.add('carrito-vacio');
                carritoVacio.textContent = 'Tu carrito está vacío';
                carritoItems.appendChild(carritoVacio);
            }
            
            // Actualizar total
            actualizarTotal();
        });
        
        // Actualizar total
        actualizarTotal();
    }
    
    // Función para actualizar el total
    function actualizarTotal() {
        const items = document.querySelectorAll('.carrito-item');
        let total = 0;
        
        items.forEach(item => {
            if (!item.classList.contains('carrito-vacio')) {
                const precio = parseFloat(item.querySelector('span:last-of-type').textContent.replace('$', ''));
                total += precio;
            }
        });
        
        document.querySelector('.carrito-total span:last-child').textContent = `$${total.toFixed(2)}`;
    }
    
    // Función para vaciar el carrito
    function vaciarCarrito() {
        // Resetear contador
        cantidadTotal = 0;
        contadorItems.textContent = cantidadTotal;
        
        // Vaciar carrito
        const carritoItems = document.querySelector('.carrito-items');
        carritoItems.innerHTML = '';
        
        // Añadir mensaje de carrito vacío
        const carritoVacio = document.createElement('div');
        carritoVacio.classList.add('carrito-vacio');
        carritoVacio.textContent = 'Tu carrito está vacío';
        carritoItems.appendChild(carritoVacio);
        
        // Actualizar total
        document.querySelector('.carrito-total span:last-child').textContent = '$0';
    }
});