const CART_KEY = 'blyss_cart';

// Cargar el carrito desde localStorage
function getCart() {
    const cartRaw = localStorage.getItem(CART_KEY);
    return cartRaw ? JSON.parse(cartRaw) : [];
}

// Guardar el carrito en localStorage
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartIcon(); // Actualizar el icono cada vez que se guarda
}

// Añadir un producto al carrito
function addToCart(product, size, color) {
    const cart = getCart();
    
    // Crear un ID único para el item en el carrito basado en el producto, talla y color
    const cartItemId = `${product.id}-${size}-${color.nombre}`;

    const existingItem = cart.find(item => item.cartItemId === cartItemId);

    if (existingItem) {
        // Si ya existe, incrementar la cantidad
        existingItem.quantity += 1;
    } else {
        // Si no existe, añadirlo como nuevo item
        cart.push({
            cartItemId,
            id: product.id,
            titulo: product.titulo,
            precio: product.precio,
            foto: product.foto,
            size,
            color,
            quantity: 1
        });
    }

    saveCart(cart);
}

// Actualizar la cantidad de un item
function updateQuantity(cartItemId, newQuantity) {
    let cart = getCart();
    const item = cart.find(item => item.cartItemId === cartItemId);

    if (item) {
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            // Si la cantidad es 0 o menos, eliminar el item
            cart = cart.filter(item => item.cartItemId !== cartItemId);
        }
    }

    saveCart(cart);
}

// Eliminar un item del carrito
function removeFromCart(cartItemId) {
    let cart = getCart();
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    saveCart(cart);
}

// Obtener el número total de items en el carrito
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Actualizar el icono del carrito en la UI
function updateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;

    const itemCount = getCartItemCount();
    
    // Eliminar el badge existente si lo hay
    const existingBadge = cartIcon.querySelector('.cart-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    if (itemCount > 0) {
        const badge = document.createElement('span');
        badge.classList.add('cart-badge');
        badge.textContent = itemCount;
        cartIcon.appendChild(badge);
        cartIcon.classList.add('has-items');
    } else {
        cartIcon.classList.remove('has-items');
    }
}

// Actualizar el icono al cargar la página
document.addEventListener('DOMContentLoaded', updateCartIcon);
