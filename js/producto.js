document.addEventListener('DOMContentLoaded', () => {
    const productDetailContainer = document.getElementById('product-detail-container');

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        productDetailContainer.innerHTML = '<p class="error-message">No se ha especificado ningún producto.</p>';
        return;
    }

    fetch('/escaparate.json')
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

    const tallasHtml = Array.isArray(product.tallas) ? product.tallas.map(talla => `<button class="size-option">${talla}</button>`).join('') : '';
    const coloresHtml = Array.isArray(product.colores) ? product.colores.map(color => 
        `<div class="color-option" style="background-color: ${color.codigo};" title="${color.nombre}" data-nombre="${color.nombre}" data-codigo="${color.codigo}"></div>`
    ).join('') : '';
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
                    <div class="option-group">
                        <h3 class="option-title">Talla:</h3>
                        <div class="size-selector">
                            ${tallasHtml}
                        </div>
                    </div>
                    <div class="option-group">
                        <h3 class="option-title">Color:</h3>
                        <div class="color-selector">
                            ${coloresHtml}
                        </div>
                    </div>
                </div>

                <button class="add-to-cart-btn">Añadir al carrito</button>

                <div class="product-description-detail">
                    <h3>Descripción</h3>
                    ${product.descripcion}
                </div>
            </div>
        </div>
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
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImage.src = thumb.src;
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    const addToCartButton = document.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const selectedSizeEl = document.querySelector('.size-option.selected');
            const selectedColorEl = document.querySelector('.color-option.selected');

            if (!selectedSizeEl) {
                alert('Por favor, selecciona una talla.');
                return;
            }
            if (!selectedColorEl) {
                alert('Por favor, selecciona un color.');
                return;
            }

            const selectedSize = selectedSizeEl.textContent;
            const selectedColor = {
                nombre: selectedColorEl.dataset.nombre,
                codigo: selectedColorEl.dataset.codigo
            };

            if (typeof window.addToCart === 'function') {
                window.addToCart(product, selectedSize, selectedColor);
            } else {
                console.warn('addToCart no está disponible. Asegúrate de cargar js/cart.js antes de js/producto.js');
            }

            addToCartButton.textContent = '¡Añadido!';
            addToCartButton.disabled = true;
            setTimeout(() => {
                addToCartButton.textContent = 'Añadir al carrito';
                addToCartButton.disabled = false;
            }, 2000);
        });
    }
}
