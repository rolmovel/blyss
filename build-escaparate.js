const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const articlesDir = path.join(__dirname, 'articles');
const outputFile = path.join(__dirname, 'dist', 'escaparate.json');

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
  return files.map(file => {
    try {
      const filePath = path.join(articlesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      // Extraer el título del contenido del markdown (la primera línea con #)
      const titleMatch = content.match(/^#\s(.+)/m);
      const title = titleMatch ? titleMatch[1] : 'Producto sin título';
      const descriptionWithoutTitle = content.replace(/^#\s(.+)/m, '');

      return {
        id: path.basename(file, '.md'),
        titulo: title,
        foto: data.foto,
        precio: data.precio,
        categoria: data.categoria || 'General',
        descripcion: marked(descriptionWithoutTitle),
        tallas: data.tallas || [],
        colores: data.colores || [],
        galeria_fotos: getGalleryImages(data.galeria, data.foto),
      };
    } catch (error) {
      console.error(`Error al procesar el archivo: ${file}`, error);
      return null;
    }
  }).filter(Boolean); // Filtra los artículos que no se pudieron procesar
}

// Nueva función para obtener las imágenes de la galería
function getGalleryImages(galleryPath, defaultImage) {
  if (!galleryPath) {
    return [defaultImage]; // Devuelve la imagen principal si no hay galería
  }

  const fullGalleryPath = path.join(__dirname, galleryPath);
  try {
    if (fs.existsSync(fullGalleryPath)) {
      const imageFiles = fs.readdirSync(fullGalleryPath);
      return imageFiles.map(file => path.join(galleryPath, file).replace(/\\/g, '/'));
    }
    return [defaultImage];
  } catch (error) {
    console.error(`Error al leer la galería de imágenes en: ${fullGalleryPath}`, error);
    return [defaultImage];
  }
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
