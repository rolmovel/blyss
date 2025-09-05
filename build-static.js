const fs = require('fs-extra');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const staticAssets = [
  'index.html',
  'escaparate.html',
  'sobre-nosotros.html',
  'styles.css',
  'script.js',
  'js',
  'assets'
];

async function copyStaticAssets() {
  console.log('Limpiando el directorio de distribución...');
  await fs.emptyDir(distDir);
  console.log('Directorio limpio.');

  console.log('Copiando archivos estáticos...');
  try {
    for (const asset of staticAssets) {
      const srcPath = path.join(__dirname, asset);
      const destPath = path.join(distDir, asset);

      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`- Copiado: ${asset}`);
      } else {
        console.warn(`- Advertencia: No se encontró el recurso ${asset}, se omitió la copia.`);
      }
    }
    console.log('✅ Archivos estáticos copiados con éxito.');
  } catch (error) {
    console.error('Error al copiar los archivos estáticos:', error);
  }
}

copyStaticAssets();
