const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const articlesDir = path.join(__dirname, 'articles');
const outputFile = path.join(__dirname, 'dist', 'escaparate.json');
const colorsConfigPath = path.join(__dirname, 'n8n-flows', 'colors-config.json');

// Función para cargar la configuración de colores
function loadColorsConfig() {
  try {
    const configContent = fs.readFileSync(colorsConfigPath, 'utf8');
    const config = JSON.parse(configContent);
    return config.colors;
  } catch (error) {
    console.error('Error al cargar configuración de colores:', error.message);
    console.log('Usando configuración por defecto...');
    return {
      "Black": { "hex": "#000000" },
      "White": { "hex": "#FFFFFF" },
      "Sport Grey": { "hex": "#D3D3D3" },
      "Light Blue": { "hex": "#ADD8E6" },
      "Cardinal": { "hex": "#C41E3A" },
      "Military Green": { "hex": "#4B5320" }
    };
  }
}

// Función para obtener todos los archivos .md de la carpeta 'articles'
function getArticleFiles() {
  try {
    return fs.readdirSync(articlesDir).filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error(`Error al leer el directorio de artículos: ${articlesDir}`, error);
    return [];
  }
}

// Función para procesar cada artículo y extraer sus datos
function processArticles(files) {
  const colorsConfig = loadColorsConfig();

  return files.map(file => {
    try {
      const filePath = path.join(articlesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      // Extraer el título del contenido del markdown (la primera línea con #)
      const titleMatch = content.match(/^#\s(.+)/m);
      const title = titleMatch ? titleMatch[1] : 'Producto sin título';
      const descriptionWithoutTitle = content.replace(/^#\s(.+)/m, '');

      // Procesar colores: agregar códigos hex desde la configuración
      const processedColors = (data.colores || []).map(color => {
        const colorName = color.nombre;
        const colorConfig = colorsConfig[colorName];

        return {
          nombre: colorName,
          codigo: colorConfig ? colorConfig.hex : '#000000' // Fallback si no se encuentra
        };
      });

      return {
        id: path.basename(file, '.md'),
        titulo: title,
        foto: data.foto,
        precio: data.precio,
        categoria: data.categoria || 'General',
        descripcion: marked(descriptionWithoutTitle),
        tallas: data.tallas || [],
        colores: processedColors, // ← Usar colores procesados con códigos hex
        galeria_fotos: getGalleryImages(data.galeria, data.foto),
        variantes: data.variantes || [], // ← Añadir variantes
      };
    } catch (error) {
      console.error(`Error al procesar el archivo: ${file}`, error);
      return null;
    }
  }).filter(Boolean); // Filtra los artículos que no se pudieron procesar
}

// Nueva función para obtener las imágenes de la galería
function getGalleryImages(galleryData, defaultImage) {
  // Si galleryData ya es un array (de URLs), lo usamos directamente.
  if (Array.isArray(galleryData)) {
    return galleryData;
  }

  // Lógica anterior para retrocompatibilidad con carpetas locales.
  let gallery = [];
  if (galleryData) {
    const fullGalleryPath = path.join(__dirname, galleryData);
    try {
      if (fs.existsSync(fullGalleryPath)) {
        const imageFiles = fs.readdirSync(fullGalleryPath);
        gallery = imageFiles.map(file => `/${path.join(galleryData, file).replace(/\\/g, '/')}`);
      }
    } catch (error) {
      console.error(`Error al leer la galería de imágenes en: ${fullGalleryPath}`, error);
    }
  }

  // Asegurarse de que la imagen principal esté en la galería si no es una URL completa.
  if (defaultImage && !defaultImage.startsWith('http') && !gallery.includes(`/${defaultImage}`)) {
      gallery.unshift(`/${defaultImage}`);
  }

  return gallery;
}

// Función principal para construir el escaparate
function buildEscaparate() {
  console.log('Iniciando la construcción del escaparate...');
  

  const articleFiles = getArticleFiles();
  if (articleFiles.length === 0) {
    console.log('No se encontraron artículos para procesar.');
    return;
  }

  console.log(`Se encontraron ${articleFiles.length} artículos.`);

  const articlesData = processArticles(articleFiles);

  try {
    fs.writeFileSync(outputFile, JSON.stringify(articlesData, null, 2));
    console.log(`\n✅ Escaparate construido con éxito en: ${outputFile}`);
  } catch (error) {
    console.error('Error al escribir el archivo JSON del escaparate.', error);
  }
}

// Ejecutar la función principal
buildEscaparate();
