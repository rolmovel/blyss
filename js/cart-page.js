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
    checkoutButton.textContent = 'Redirigiendo al pago...';

    const cart = getCart();

    // Debes reemplazar esta clave con tu clave pública de Stripe
    const stripe = Stripe('pk_test_51S55ZhCckC1cpOptJ09rw791kRBLmZJULxInW0X1Immr2kZ3yzwQ98eGiZhKkEBq7C3J1aMBBfkXOLKef7Ntnp6D00gHsmuM4g');

    try {
        // 1. Llama a tu función serverless para crear la sesión de pago
        const response = await fetch('https://gkhz4ie3vxhgxjt22owcqh3zpi0xblsu.lambda-url.eu-west-1.on.aws/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cart),
        });

        if (!response.ok) {
            throw new Error('No se pudo crear la sesión de pago.');
        }

        const session = await response.json();

        // 2. Redirige al usuario a la página de pago de Stripe
        const result = await stripe.redirectToCheckout({
            sessionId: session.id,
        });

        if (result.error) {
            // Si hay un error en la redirección (poco común), muéstralo
            alert(result.error.message);
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Finalizar Compra';
        }

    } catch (error) {
        console.error('Error al procesar el pago:', error);
        alert('Hubo un problema al redirigir a la pasarela de pago. Por favor, inténtalo de nuevo.');
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Finalizar Compra';
    }
}
