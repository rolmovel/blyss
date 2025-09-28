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
function addToCart(product, variantInfo) {
    const cart = getCart();

    // Usar el printfulId como ID único si existe. Si no, crear uno a partir de talla y color.
    const cartItemId = variantInfo.printfulId ? variantInfo.printfulId.toString() : `${product.id}-${variantInfo.size}-${variantInfo.color.nombre}`;

    if (!cartItemId) {
        console.error('El producto que intentas añadir no tiene un identificador único.');
        return;
    }

    const existingItem = cart.find(item => item.cartItemId === cartItemId);

    if (existingItem) {
        // Si ya existe, incrementar la cantidad
        existingItem.quantity += 1;
    } else {
        // Si no existe, añadirlo como nuevo item
        cart.push({
            cartItemId: cartItemId, // ID único (printfulId si existe)
            id: product.id, // ID del producto base
            titulo: product.titulo,
            precio: product.precio, // Usar el precio base del producto
            foto: product.foto,
            size: variantInfo.size,
            color: variantInfo.color,
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

// Limpiar todo el carrito
function clearCart() {
    saveCart([]);
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
