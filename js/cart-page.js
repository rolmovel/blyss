document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');

    function renderCart() {
        const cart = getCart();
        
        if (!cartContainer) return;

        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="cart-empty">
                    <p>Tu carrito está vacío.</p>
                    <a href="escaparate.html" class="cta-button">Seguir comprando</a>
                </div>
            `;
            return;
        }

        const cartItemsHtml = cart.map(item => `
            <div class="cart-item">
                <img src="${item.foto}" alt="${item.titulo}" class="cart-item-image">
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${item.titulo}</h3>
                    <p class="cart-item-meta">Talla: ${item.size}</p>
                    <div class="cart-item-meta">
                        Color: <span class="color-swatch" style="background-color: ${item.color.codigo};"></span>
                        ${item.color.nombre}
                    </div>
                    <p class="cart-item-price">€${item.precio.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn" data-id="${item.cartItemId}" data-change="-1">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.cartItemId}" data-change="1">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.cartItemId}">Eliminar</button>
                </div>
                <div class="cart-item-total">
                    <p>€${(item.precio * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        `).join('');

        const subtotal = cart.reduce((total, item) => total + (item.precio * item.quantity), 0);

        cartContainer.innerHTML = `
            <div class="cart-items-list">
                ${cartItemsHtml}
            </div>
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>€${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>€${subtotal.toFixed(2)}</span>
                </div>
                <button class="cta-button checkout-btn">Finalizar Compra</button>
            </div>
        `;

        addCartEventListeners();
    }

    function addCartEventListeners() {
        // Eventos para los botones de cantidad
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItemId = e.target.dataset.id;
                const change = parseInt(e.target.dataset.change, 10);
                const cart = getCart();
                const item = cart.find(i => i.cartItemId === cartItemId);
                if (item) {
                    updateQuantity(cartItemId, item.quantity + change);
                    renderCart(); // Volver a renderizar el carrito
                }
            });
        });

        // Evento para el botón de eliminar
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItemId = e.target.dataset.id;
                removeFromCart(cartItemId);
                renderCart(); // Volver a renderizar el carrito
            });
        });

        // Evento para el botón de finalizar compra
        document.querySelector('.checkout-btn').addEventListener('click', handleCheckout);

    }

    renderCart();
});

async function handleCheckout() {
    const checkoutButton = document.querySelector('.checkout-btn');
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Procesando...';

    const cart = getCart();
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const payload = cart.map(item => ({
        fecha_pedido: today,
        producto: item.id,
        cantidad: item.quantity,
        talla: item.size.toLowerCase(),
        color: item.color.nombre.toLowerCase()
    }));

    try {
        const response = await fetch('https://108.129.164.139:5679/webhook/pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Si la respuesta no es exitosa, lanzamos un error para que lo capture el bloque catch
            const errorData = await response.text(); // Intenta leer el cuerpo del error
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}. Detalles: ${errorData}`);
        }

        alert('¡Pedido realizado con éxito!');
        saveCart([]); // Vaciar el carrito
        window.location.href = 'index.html'; // Redirigir a la página de inicio

    } catch (error) {
        console.error('Error al realizar el pedido:', error);
        alert(`No se pudo completar el pedido. Por favor, inténtalo de nuevo más tarde.\nError: ${error.message}`);
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Finalizar Compra';
    }
}

