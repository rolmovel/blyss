const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración
const PRINTFUL_API_KEY = 'zQrinjIdpbA0TRoKXUSbuYNFVxtLXhMhBzQr8Zkc';
const STORE_ID = '16871883'; // Tienda de Rodrigo
const articlesDir = path.join(__dirname, '..', 'articles');

// Mapeo de colores
const printfulColors = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Sport Grey': '#D3D3D3',
  'Light Blue': '#ADD8E6',
  'Cardinal': '#C41E3A',
  'Military Green': '#4B5320',
  'Navy': '#000080',
  'Red': '#FF0000',
  'Royal Blue': '#4169E1',
  'Forest Green': '#228B22',
  'Purple': '#800080',
  'Pink': '#FFC0CB',
  'Yellow': '#FFFF00',
  'Orange': '#FFA500',
  'Brown': '#A52A2A',
  'Heather Grey': '#9B9B9B',
  'Charcoal': '#36454F',
  'Maroon': '#800000'
};

// Función para hacer llamadas a la API de Printful
function callPrintfulAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.printful.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': STORE_ID,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.code === 200) {
            resolve(parsed.result);
          } else {
            reject(new Error(`API Error (${parsed.code}): ${JSON.stringify(parsed.error || parsed)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Función para generar el contenido del archivo markdown
function generateMarkdownFile(productData) {
  const productInfo = productData.sync_product;
  const variants = productData.sync_variants;

  // Calcular precio base (de la primera variante)
  const basePrice = variants.length > 0 ? variants[0].retail_price : '0.00';

  // --- Construcción del Front Matter en YAML ---
  let frontMatter = '---\n';

  // 1. Foto principal del producto
  frontMatter += `foto: ${productInfo.thumbnail_url || ''}\n`;

  // 2. Precio base
  frontMatter += `precio: ${basePrice}\n`;

  // 3. Categoría
  frontMatter += `categoria: "Unisex"\n`;

  // 4. Lista de Tallas
  const tallas = [...new Set(variants.map(v => v.size).filter(s => s))].sort();
  frontMatter += 'tallas:\n';
  tallas.forEach(talla => {
    frontMatter += `  - ${talla}\n`;
  });

  // 5. Lista de Colores
  const colores = [];
  const colorMap = new Map();

  variants.forEach(v => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, {
        nombre: v.color,
        codigo: printfulColors[v.color] || '#000000'
      });
    }
  });
  colores.push(...colorMap.values());

  frontMatter += 'colores:\n';
  colores.forEach(color => {
    frontMatter += `  - nombre: "${color.nombre}"\n`;
    frontMatter += `    codigo: "${color.codigo}"\n`;
  });

  // 6. Lista de Variantes (con external_id)
  frontMatter += 'variantes:\n';
  variants.forEach(variant => {
    frontMatter += `  - printfulId: ${variant.external_id}\n`;
    frontMatter += `    talla: "${variant.size}"\n`;
    frontMatter += `    color: "${variant.color}"\n`;
  });

  // 7. Galería de imágenes
  const galeriaUrls = [];
  const galeriaMap = new Map();
  variants.forEach(v => {
    const previewFile = v.files.find(f => f.type === 'preview');
    if (previewFile && !galeriaMap.has(v.color)) {
      galeriaMap.set(v.color, previewFile.preview_url);
    }
  });
  galeriaUrls.push(...galeriaMap.values());

  frontMatter += 'galeria:\n';
  galeriaUrls.forEach(url => {
    frontMatter += `  - ${url}\n`;
  });

  frontMatter += '---\n\n';

  // --- Construcción del Contenido Markdown ---
  const titulo = productInfo.name;
  const descripcion = `Aquí va la descripción de tu producto: ${titulo}. Personalízala para mejorar el SEO y la experiencia de usuario.`;
  const markdownContent = `# ${titulo}\n\n${descripcion}\n`;

  const fileContent = frontMatter + markdownContent;
  const fileName = productInfo.id + '.md';

  return { fileName, fileContent };
}

// Función principal
async function importarProductos() {
  console.log('🚀 Iniciando importación de productos desde Printful...\n');

  try {
    // 1. Obtener lista de productos
    console.log('📦 Obteniendo lista de productos...');
    const products = await callPrintfulAPI('/store/products');
    console.log(`✅ Se encontraron ${products.length} productos\n`);

    // 2. Procesar cada producto
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        console.log(`📄 Procesando: ${product.name} (ID: ${product.id})`);

        // Obtener detalles completos del producto
        const productDetails = await callPrintfulAPI(`/store/products/${product.id}`);

        // Generar archivo markdown
        const { fileName, fileContent } = generateMarkdownFile(productDetails);

        // Guardar archivo
        const filePath = path.join(articlesDir, fileName);
        fs.writeFileSync(filePath, fileContent, 'utf8');

        console.log(`   ✅ Guardado: ${fileName}`);
        successCount++;

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Error procesando producto ${product.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de importación:');
    console.log(`   ✅ Productos importados: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📄 Total procesados: ${products.length}`);

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar
importarProductos();
