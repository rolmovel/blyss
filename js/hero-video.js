document.addEventListener('DOMContentLoaded', () => {
    const videoContainer = document.querySelector('.hero-video-container');
    const video1 = document.querySelector('.hero-video-1');
    const video2 = document.querySelector('.hero-video-2');
    const overlay = document.querySelector('.video-overlay');
    const flashTexts = document.querySelectorAll('.flash-text');

    if (!videoContainer || !video1 || !video2) {
        console.error('No se encontraron los elementos de video necesarios');
        return;
    }

    let currentVideo = 1;
    let isTransitioning = false;

    // Función para mostrar texto con efecto flash
    function showFlashText() {
        if (isTransitioning) return;

        flashTexts.forEach((text, index) => {
            setTimeout(() => {
                text.classList.add('flash');
                setTimeout(() => {
                    text.classList.remove('flash');
                }, 800);
            }, index * 200);
        });
    }

    // Función para hacer la transición entre videos
    function transitionToNextVideo() {
        if (isTransitioning) return;

        isTransitioning = true;

        // Fundido a negro
        overlay.style.opacity = '1';

        setTimeout(() => {
            // Cambiar de video
            if (currentVideo === 1) {
                video1.style.display = 'none';
                video2.style.display = 'block';
                currentVideo = 2;
            } else {
                video2.style.display = 'none';
                video1.style.display = 'block';
                currentVideo = 1;
            }

            // Mostrar texto flash
            showFlashText();

            // Fundido de vuelta
            setTimeout(() => {
                overlay.style.opacity = '0';
                isTransitioning = false;
            }, 1000);
        }, 1000);
    }

    // Configurar eventos de los videos
    function setupVideo(video) {
        video.muted = true; // Requerido para autoplay
        video.playsInline = true; // Para móviles

        // Cuando termine un video, hacer la transición
        video.addEventListener('ended', transitionToNextVideo);

        // También hacer transición a la mitad del video para más dinamismo
        video.addEventListener('timeupdate', () => {
            if (video.currentTime > video.duration / 2 && !isTransitioning) {
                // Pequeña probabilidad de transición a la mitad para más variedad
                if (Math.random() < 0.3) {
                    transitionToNextVideo();
                }
            }
        });

        // Reproducir automáticamente
        video.play().catch(e => {
            console.log('Error reproduciendo video:', e);
        });
    }

    // Configurar ambos videos
    setupVideo(video1);
    setupVideo(video2);

    // Iniciar el ciclo
    console.log('🎥 Hero video system initialized');
});
