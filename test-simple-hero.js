const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testSimpleHeroVideo() {
    console.log('🎥 Probando hero video simple...');

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

        console.log('✅ Video encontrado en la página');

        // Verificar que el video tiene la fuente correcta
        const videoSrc = await page.evaluate(() => {
            const video = document.querySelector('.hero-video');
            return {
                src: video.querySelector('source')?.src || '',
                autoplay: video.autoplay,
                muted: video.muted,
                loop: video.loop
            };
        });

        console.log('🎬 Configuración del video:', videoSrc);

        // Verificar que usa hero2.mp4
        if (videoSrc.src.includes('hero2.mp4')) {
            console.log('✅ Video configurado con hero2.mp4');
        } else {
            console.log('❌ Video no usa hero2.mp4');
        }

        // Verificar que el archivo existe
        const videoPath = path.join(__dirname, 'dist', 'assets', 'video', 'hero2.mp4');
        if (fs.existsSync(videoPath)) {
            console.log('✅ Archivo hero2.mp4 disponible');
        } else {
            console.log('❌ Archivo hero2.mp4 no encontrado');
        }

        // Tomar screenshot
        const screenshotPath = path.join(__dirname, 'simple-hero-screenshot.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        console.log(`📸 Screenshot guardado: ${screenshotPath}`);

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    } finally {
        await browser.close();
        console.log('🔚 Pruebas completadas');
    }
}

testSimpleHeroVideo().catch(console.error);
