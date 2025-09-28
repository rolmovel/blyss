const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testHeroVideoWithPuppeteer() {
  console.log('🎥 Iniciando pruebas del hero video con Puppeteer...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Cargar la página principal
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    const fileUrl = `file://${indexPath}`;

    console.log('📄 Cargando página principal:', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle2' });

    // Esperar a que se cargue el video
    await page.waitForSelector('.hero-video', { timeout: 5000 });

    // Verificar que el video se cargó
    const videoExists = await page.$('.hero-video');
    if (!videoExists) {
      console.log('❌ No se encontró el elemento de video');
      return;
    }

    console.log('✅ Video encontrado en la página');

    // Verificar las propiedades del video
    const videoProperties = await page.evaluate(() => {
      const video = document.querySelector('.hero-video');
      return {
        src: video.src,
        autoplay: video.autoplay,
        muted: video.muted,
        loop: video.loop,
        width: video.style.width,
        height: video.style.height,
        objectFit: video.style.objectFit
      };
    });

    console.log('🎬 Propiedades del video:', videoProperties);

    // Verificar que el video tiene las propiedades correctas
    if (videoProperties.autoplay && videoProperties.muted && videoProperties.loop) {
      console.log('✅ Video configurado correctamente (autoplay, muted, loop)');
    } else {
      console.log('⚠️  Video no tiene todas las propiedades esperadas');
    }

    // Verificar que el archivo de video existe
    const videoPath = path.join(__dirname, 'dist', 'assets', 'video', 'hero.mp4');
    if (fs.existsSync(videoPath)) {
      console.log('✅ Archivo de video encontrado en el servidor');
    } else {
      console.log('❌ Archivo de video no encontrado');
    }

    // Verificar que los productos destacados siguen funcionando
    const featuredProductsCount = await page.$$eval('#featured-products-grid .product-card', elements => elements.length);
    console.log(`✅ Encontrados ${featuredProductsCount} productos destacados`);

    // Tomar screenshot para verificación visual
    const screenshotPath = path.join(__dirname, 'hero-video-screenshot.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`📸 Screenshot guardado: ${screenshotPath}`);

    // Verificar que el contenido del hero sigue siendo legible
    const heroContent = await page.evaluate(() => {
      const title = document.querySelector('.hero-title')?.textContent;
      const subtitle = document.querySelector('.hero-subtitle')?.textContent;
      const button = document.querySelector('.cta-button')?.textContent;
      return { title, subtitle, button };
    });

    console.log('📝 Contenido del hero:', heroContent);

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await browser.close();
    console.log('🔚 Pruebas del hero video completadas');
  }
}

// Ejecutar las pruebas
testHeroVideoWithPuppeteer().catch(console.error);
