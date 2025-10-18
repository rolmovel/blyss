// La entrada es el JSON completo para un solo producto.
const productData = items[0].json;

// Extraemos la información principal del producto y sus variantes.
const productInfo = productData.result.sync_product;
const variants = productData.result.sync_variants;

// Intentamos obtener códigos de colores desde el JSON de Printful
// Nota: La API de Printful no proporciona códigos hex directamente en sync_variants
// Los códigos deben obtenerse de otra fuente o mapeo

// Por ahora usamos un mapeo basado en nombres de colores comunes de Printful
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

// Para obtener códigos de colores reales de Printful, necesitarías:
// 1. Hacer una llamada adicional a: https://api.printful.com/products/{productId}
// 2. O usar el endpoint de colores: https://api.printful.com/colors
// 3. O extraer de las imágenes del producto usando análisis de color

// Función para obtener códigos de colores reales desde la API de Printful
// Nota: Requiere configuración de HTTP Request en n8n
async function getPrintfulColors() {
  try {
    // Endpoint: https://api.printful.com/colors
    // Requiere autenticación con API key
    const response = await fetch('https://api.printful.com/colors', {
      headers: {
        'Authorization': 'Bearer YOUR_PRINTFUL_API_KEY'
      }
    });
    const colorsData = await response.json();

    // Crear mapeo desde los datos reales
    const realColorMap = {};
    colorsData.result.forEach(color => {
      realColorMap[color.name] = color.hex;
    });

    return realColorMap;
  } catch (error) {
    console.error('Error obteniendo colores reales:', error);
    return printfulColors; // Fallback al mapeo por defecto
  }
}

// --- Construcción del Front Matter en YAML ---
let frontMatter = '---\n';

// 1. Foto principal del producto (URL de Printful).
frontMatter += `foto: ${productInfo.thumbnail_url || ''}\n`;

// 2. Precio base (tomado de la primera variante).
frontMatter += `precio: ${basePrice}\n`;

// 3. Categoría (puedes ajustarla).
frontMatter += `categoria: "Unisex"\n`;

// 4. Lista de Tallas (extraídas de las variantes para la UI)
const tallas = [...new Set(variants.map(v => v.size).filter(s => s))].sort();
frontMatter += 'tallas:\n';
tallas.forEach(talla => {
  frontMatter += `  - ${talla}\n`;
});

// 5. Lista de Colores (extraída de las variantes para la UI).
const colores = [];
const colorMap = new Map();

// TODO: Implementar llamada real a API de colores en n8n
// Por ahora usamos el mapeo por defecto
const currentColorMap = printfulColors; // Reemplazar con getPrintfulColors() cuando esté implementado

variants.forEach(v => {
  if (!colorMap.has(v.color)) {
    // Guardamos solo el nombre del color (el código se obtendrá del config durante el build)
    colorMap.set(v.color, {
      nombre: v.color,
      // El código hex se obtendrá desde colors-config.json durante el build estático
    });
  }
});
colores.push(...colorMap.values());

frontMatter += 'colores:\n';
colores.forEach(color => {
  frontMatter += `  - nombre: "${color.nombre}"\n`;
  frontMatter += `    codigo: "${color.codigo}"\n`;
});

// 6. Lista de Variantes (con los external_id de Printful).
frontMatter += 'variantes:\n';
variants.forEach(variant => {
  frontMatter += `  - printfulId: ${variant.external_id}\n`;
  frontMatter += `    talla: "${variant.size}"\n`;
  frontMatter += `    color: "${variant.color}"\n`;
});

// 7. Galería de imágenes (URLs de las previsualizaciones de cada color).
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

// --- Generar el nombre del archivo ---
const fileName = productInfo.id + '.md';

// Devolvemos el resultado para el siguiente nodo
return {
  json: {
    fileName: fileName,
    fileContent: fileContent
  }
};