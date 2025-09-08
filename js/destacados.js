document.addEventListener('DOMContentLoaded', () => {
  const featuredGrid = document.getElementById('featured-products-grid');

  if (!featuredGrid) {
    console.error('No se encontró el contenedor de productos destacados.');
    return;
  }

  fetch('destacados-data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error al cargar los destacados: ${response.statusText}`);
      }
      return response.json();
    })
    .then(destacados => {
      if (!destacados || destacados.length === 0) {
        featuredGrid.innerHTML = '<p>No hay productos destacados en este momento.</p>';
        return;
      }

      // Limpiar el contenedor
      featuredGrid.innerHTML = '';

      destacados.forEach(article => {
        const productCard = document.createElement('a');
        productCard.href = `producto.html?id=${article.id}`;
        productCard.classList.add('product-card');

        productCard.innerHTML = `
          <div class="product-image">
            <img src="${article.foto}" alt="${article.titulo}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="product-info">
            <h3 class="product-name">${article.titulo}</h3>
            <p class="product-price">€${article.precio.toFixed(2)}</p>
          </div>
        `;
        featuredGrid.appendChild(productCard);
      });
    })
    .catch(error => {
      console.error('Error al procesar los productos destacados:', error);
      featuredGrid.innerHTML = '<p>Error al cargar los productos destacados.</p>';
    });
});
