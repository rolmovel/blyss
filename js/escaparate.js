document.addEventListener('DOMContentLoaded', () => {
  const productsGallery = document.querySelector('.products-gallery');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const paginationContainer = document.querySelector('.pagination');

  if (!productsGallery) {
    console.error('No se encontró la galería de productos.');
    return;
  }

  let allArticles = [];
  let filteredArticles = [];
  const articlesPerPage = 6;
  let currentPage = 1;
  let currentFilter = 'all';

  // Función para renderizar los productos de la página actual
  function renderProducts() {
    productsGallery.innerHTML = '';
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const articlesToShow = filteredArticles.slice(startIndex, endIndex);

    if (articlesToShow.length === 0) {
        productsGallery.innerHTML = '<p>No hay artículos que coincidan con tu búsqueda.</p>';
        return;
    }

    articlesToShow.forEach(article => {
      const productCard = document.createElement('a');
      productCard.href = `producto.html?id=${article.id}`;
      productCard.classList.add('product-card');
      productCard.setAttribute('data-category', article.categoria.toLowerCase());

      productCard.innerHTML = `
        <div class="product-image">
          <img loading="lazy" src="${article.foto}" alt="${article.titulo}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="product-info">
          <h3 class="product-name">${article.titulo}</h3>
          <p class="product-price">€${article.precio.toFixed(2)}</p>
        </div>
      `;
      productsGallery.appendChild(productCard);
    });
  }

  // Función para renderizar los controles de paginación
  function renderPagination() {
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

    if (totalPages <= 1) return; // No mostrar paginación si solo hay una página

    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.classList.add('page-btn');
      if (i === currentPage) {
        pageButton.classList.add('active');
      }
      pageButton.addEventListener('click', () => {
        currentPage = i;
        renderProducts();
        renderPagination();
      });
      paginationContainer.appendChild(pageButton);
    }
  }

  // Función para aplicar filtros
  function applyFilter(filter) {
    currentFilter = filter;
    if (filter === 'all') {
      filteredArticles = [...allArticles];
    } else {
      filteredArticles = allArticles.filter(article => article.categoria.toLowerCase() === filter);
    }
    currentPage = 1;
    renderProducts();
    renderPagination();
  }

  // Cargar los datos iniciales
  fetch('escaparate.json')
    .then(response => response.json())
    .then(articles => {
      allArticles = articles;
      applyFilter('all'); // Mostrar todos los artículos por defecto
    })
    .catch(error => {
      console.error('Error al cargar los artículos:', error);
      productsGallery.innerHTML = '<p>Error al cargar los productos.</p>';
    });

  // Añadir eventos a los botones de filtro
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.getAttribute('data-filter');
      applyFilter(filter);
    });
  });
});
