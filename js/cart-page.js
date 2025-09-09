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
                <div id="shipping-address-container" class="hidden">
                    <h3 class="shipping-title">Dirección de Envío</h3>
                    <form id="shipping-form">
                        <div class="form-group">
                            <label for="address">Dirección</label>
                            <input type="text" id="address" name="address" required>
                        </div>
                        <div class="form-group">
                            <label for="city">Ciudad</label>
                            <input type="text" id="city" name="city" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="state">Provincia</label>
                                <input type="text" id="state" name="state" required>
                            </div>
                            <div class="form-group">
                                <label for="zip">Código Postal</label>
                                <input type="text" id="zip" name="zip" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="country">País</label>
                            <input type="text" id="country" name="country" value="España" required>
                        </div>
                        <button type="submit" class="cta-button continue-checkout-btn">Continuar al pago</button>
                    </form>
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
        document.querySelector('.checkout-btn').addEventListener('click', () => {
            document.getElementById('shipping-address-container').classList.remove('hidden');
            document.querySelector('.checkout-btn').classList.add('hidden');
        });

        document.getElementById('shipping-form').addEventListener('submit', (e) => {
            e.preventDefault();
            handleCheckout();
        });

        // Cargar la dirección guardada, si existe
        loadShippingAddress();
    }

    function loadShippingAddress() {
        const savedAddress = localStorage.getItem('shippingAddress');
        if (savedAddress) {
            const address = JSON.parse(savedAddress);
            // Comprobar si el formulario existe antes de intentar rellenarlo
            const addressInput = document.getElementById('address');
            if (addressInput) {
                addressInput.value = address.address || '';
                document.getElementById('city').value = address.city || '';
                document.getElementById('state').value = address.state || '';
                document.getElementById('zip').value = address.zip || '';
                document.getElementById('country').value = address.country || '';
            }
        }
    }

    renderCart();
});

async function handleCheckout() {
    const continueButton = document.querySelector('.continue-checkout-btn');
    continueButton.disabled = true;
    continueButton.textContent = 'Procesando...';

    const cart = getCart();
    const form = document.getElementById('shipping-form');
    const formData = new FormData(form);
    const shippingAddress = {
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip'),
        country: formData.get('country'),
    };

    // Guardar la dirección en localStorage para futuras compras
    localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress));

    // Aquí se puede añadir la validación de la dirección contra un sistema externo

    const payload = {
        cart,
        shippingAddress,
    };

    // Debes reemplazar esta clave con tu clave pública de Stripe
    const stripe = Stripe('pk_test_51S55ZhCckC1cpOptJ09rw791kRBLmZJULxInW0X1Immr2kZ3yzwQ98eGiZhKkEBq7C3J1aMBBfkXOLKef7Ntnp6D00gHsmuM4g');

    try {
        // 1. Llama a tu función serverless para crear la sesión de pago
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
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
            continueButton.disabled = false;
            continueButton.textContent = 'Continuar al pago';
        }

    } catch (error) {
        console.error('Error al procesar el pago:', error);
        alert('Hubo un problema al redirigir a la pasarela de pago. Por favor, inténtalo de nuevo.');
        continueButton.disabled = false;
        continueButton.textContent = 'Continuar al pago';
    }
}
