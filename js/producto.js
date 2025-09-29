document.addEventListener('DOMContentLoaded', () => {
    const productDetailContainer = document.getElementById('product-detail-container');

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        productDetailContainer.innerHTML = '<p class="error-message">No se ha especificado ningún producto.</p>';
        return;
    }

    fetch('escaparate.json')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar la información de los productos.');
            return response.json();
        })
        .then(products => {
            const product = products.find(p => p.id === productId);

            if (!product) {
                productDetailContainer.innerHTML = `<p class="error-message">Producto no encontrado. ID: ${productId}</p>`;
                return;
            }

            renderProductDetail(product);
        })
        .catch(error => {
            console.error('Error al cargar el detalle del producto:', error);
            productDetailContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        });
});

function renderProductDetail(product) {
    const container = document.getElementById('product-detail-container');
    document.title = `${product.titulo} - Blyss`;

    const hasSizes = Array.isArray(product.tallas) && product.tallas.length > 0;
    const tallasHtml = hasSizes ? product.tallas.map(talla => `<button class="size-option">${talla}</button>`).join('') : '';
    const coloresHtml = Array.isArray(product.colores) ? product.colores.map(color => 
        `<div class="color-option" style="background-color: ${color.codigo};" title="${color.nombre}" data-nombre="${color.nombre}" data-codigo="${color.codigo}"></div>`
    ).join('') : '';
    const hasColors = Array.isArray(product.colores) && product.colores.length > 0;
    const galeriaHtml = Array.isArray(product.galeria_fotos) ? product.galeria_fotos.map((foto, index) => 
        `<img loading="lazy" src="${foto}" alt="Vista ${index + 1} de ${product.titulo}" class="thumbnail-img ${index === 0 ? 'active' : ''}">`
    ).join('') : '';
    const imagenPrincipal = Array.isArray(product.galeria_fotos) && product.galeria_fotos.length > 0 ? product.galeria_fotos[0] : product.foto;

    container.innerHTML = `
        <div class="product-detail-layout">
            <div class="product-gallery">
                <div class="main-image-container">
                    <img loading="lazy" src="${imagenPrincipal}" alt="${product.titulo}" id="main-product-image">
                </div>
                <div class="thumbnail-container">
                    ${galeriaHtml}
                </div>
            </div>
            <div class="product-info-details">
                <h1 class="product-title-detail">${product.titulo}</h1>
                <p class="product-price-detail">€${product.precio.toFixed(2)}</p>
                
                <div class="product-options">
                    ${hasSizes ? `
                    <div class="option-group">
                        <h3 class="option-title">Talla:</h3>
                        <div class="size-selector">
                            ${tallasHtml}
                        </div>
                    </div>` : ''}
                    ${hasColors ? `
                    <div class="option-group">
                        <h3 class="option-title">Color:</h3>
                        <div class="color-selector">
                            ${coloresHtml}
                        </div>
                    </div>` : ''}
                </div>

                <button class="add-to-cart-btn">Añadir al carrito</button>

                <div class="product-description-detail">
                    <h3>Descripción</h3>
                    ${product.descripcion}
                </div>
            </div>
        </div>
        <div id="toast" role="status" aria-live="polite" aria-atomic="true" class="toast" hidden></div>
    `;
    // mark rendered for tests/verification
    container.setAttribute('data-rendered', '1');

    // Preseleccionar primera talla y color si existen
    const firstSize = document.querySelector('.size-option');
    if (firstSize) firstSize.classList.add('selected');
    const firstColor = document.querySelector('.color-option');
    if (firstColor) firstColor.classList.add('selected');

    addEventListenersToOptions(product);
}

// Importante: Usar la función global addToCart definida en js/cart.js

function addEventListenersToOptions(product) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail-img');
    const sizeOptions = document.querySelectorAll('.size-option');
    const colorOptions = document.querySelectorAll('.color-option');

    // Thumbnail click updates main image
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            mainImage.src = thumb.src;
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');

            if (colorOptions[index]) {
                colorOptions.forEach(c => c.classList.remove('selected'));
                colorOptions[index].classList.add('selected');
            }
        });
    });

    colorOptions.forEach((option, index) => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (thumbnails[index]) {
                thumbnails[index].click();
            }
        });
    });

    // Size selection
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    const addToCartButton = document.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const selectedSizeEl = document.querySelector('.size-option.selected');
            const selectedColorEl = document.querySelector('.color-option.selected');

            const selectedSize = selectedSizeEl ? selectedSizeEl.textContent : null;
            const selectedColorName = selectedColorEl ? selectedColorEl.dataset.nombre : null;

            const hasVariants = product.variantes && product.variantes.length > 0;
            let selectedVariant = null;

            // Si el producto tiene tallas o colores, la selección es obligatoria.
            if (product.tallas.length > 0 && !selectedSize) {
                alert('Por favor, selecciona una talla.');
                return;
            }
            if (product.colores.length > 0 && !selectedColorName) {
                alert('Por favor, selecciona un color.');
                return;
            }

            // Si hay variantes, encontrar la que coincide.
            if (hasVariants) {
                selectedVariant = product.variantes.find(v => {
                    const sizeMatch = product.tallas.length === 0 || v.talla === selectedSize;
                    const colorMatch = product.colores.length === 0 || v.color === selectedColorName;
                    return sizeMatch && colorMatch;
                });

                if (!selectedVariant) {
                    alert('Esta combinación de talla y color no está disponible.');
                    return;
                }
            }

            if (typeof window.addToCart === 'function') {
                // Pasamos el producto base y la variante específica encontrada.
                // Si no hay variante, pasamos null.
                const variantInfoForCart = selectedVariant ? {
                    ...selectedVariant,
                    // Añadimos el objeto de color completo para el carrito
                    color: product.colores.find(c => c.nombre === selectedVariant.color)
                } : {
                    // Para productos sin variantes, creamos un objeto compatible
                    size: selectedSize,
                    color: product.colores.find(c => c.nombre === selectedColorName)
                };

                window.addToCart(product, variantInfoForCart);
            } else {
                console.warn('addToCart no está disponible.');
            }

            showToast('Producto añadido al carrito');
        });
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.hidden = true;
    }, 1800);
}
