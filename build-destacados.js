const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const escaparateFile = path.join(distDir, 'escaparate.json');
const destacadosConfigFile = path.join(__dirname, 'destacados', 'destacados.json');
const destacadosOutputFile = path.join(distDir, 'destacados-data.json');

function buildDestacados() {
  console.log('Iniciando la construcción de los destacados...');

  try {
    // 1. Leer los datos de todos los artículos
    if (!fs.existsSync(escaparateFile)) {
      console.error(`Error: El archivo ${escaparateFile} no existe. Ejecuta primero el script del escaparate.`);
      return;
    }
    const allArticles = JSON.parse(fs.readFileSync(escaparateFile, 'utf8'));

    // 2. Leer la configuración de los destacados
    if (!fs.existsSync(destacadosConfigFile)) {
      console.error(`Error: El archivo de configuración ${destacadosConfigFile} no existe.`);
      return;
    }
    const destacadosConfig = JSON.parse(fs.readFileSync(destacadosConfigFile, 'utf8'));
    const destacadosIDs = destacadosConfig.productos || [];

    if (destacadosIDs.length === 0) {
      console.log('No hay productos destacados para procesar.');
      // Asegurarse de que el archivo de salida esté vacío si no hay destacados
      fs.writeFileSync(destacadosOutputFile, JSON.stringify([], null, 2));
      return;
    }

    // 3. Filtrar los artículos para obtener solo los destacados
    const destacadosData = allArticles.filter(article => destacadosIDs.includes(article.id));

    // 4. Escribir el archivo final de destacados
    fs.writeFileSync(destacadosOutputFile, JSON.stringify(destacadosData, null, 2));
    console.log(`✅ Datos de destacados construidos con éxito en: ${destacadosOutputFile}`);

  } catch (error) {
    console.error('Error al procesar los productos destacados.', error);
  }
}

// Ejecutar la función
buildDestacados();
