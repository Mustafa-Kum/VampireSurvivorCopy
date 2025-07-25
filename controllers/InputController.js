// Tek seferlik kullanım veya küçük projeler için, cache'lemeye çok ihtiyaç yok. 
// Ancak yoğun kullanım varsa, sonucu bir değişkende saklamak faydalı olabilir.
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

function handleMobileLayout() {
    const healthDisplay = document.getElementById('health-display');
    // healthDisplay yoksa daha fazla işlem yapmaya gerek yok
    if (!healthDisplay) {
        return;
    }

    const uiOverlay = document.getElementById('ui-overlay');
    const isMobile = window.innerWidth <= 768;

    // mobileHealthContainer'ı mümkünse tek seferde alıyoruz
    let mobileHealthContainer = document.getElementById('mobile-health-container');

    if (isMobile) {
        // Mobil ekran ise...
        if (!mobileHealthContainer) {
            mobileHealthContainer = document.createElement('div');
            mobileHealthContainer.id = 'mobile-health-container';
            document.body.appendChild(mobileHealthContainer);
        }
        if (!mobileHealthContainer.contains(healthDisplay)) {
            mobileHealthContainer.appendChild(healthDisplay);
        }
    } else {
        // Masaüstü ekran ise...
        if (mobileHealthContainer && mobileHealthContainer.contains(healthDisplay)) {
            uiOverlay.insertBefore(healthDisplay, uiOverlay.children[1]);
        }
        if (mobileHealthContainer && mobileHealthContainer.parentNode) {
            mobileHealthContainer.parentNode.removeChild(mobileHealthContainer);
        }
    }
}

function createWaveKey(types) {
    if (types.length === 1) return types[0];

    // Capitalize each type after the first and concatenate with 'And'
    return types.slice(1).reduce((acc, type) => 
        acc + 'And' + type.charAt(0).toUpperCase() + type.slice(1), 
        types[0]
    );
}

// handleTouchMove ve handleTouchEnd içinde joystickContainer'ı veya diğer elemanları 
// fonksiyon dışına çıkarıp cache'lemek de mümkün; ancak yaratılma/temizlenme 
// durumlarına göre aynı isimli elementin değişmesi söz konusu değilse faydalı olur.
function handleTouchMove(e) {
    if (!joystickActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const maxDistance = 40; // Joystick hareket mesafesi

    let dx = touch.clientX - startX;
    let dy = touch.clientY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Mesafe maxDistance'ı aştığında orantılı kısalt
    if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        dx *= ratio;
        dy *= ratio;
    }

    // Knob'u hareket ettir
    joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Karakterin hareket yönünü ve hızını hesapla
    const angle = Math.atan2(dy, dx);
    const normalizedDx = dx / maxDistance;
    const normalizedDy = dy / maxDistance;

    game.joystickInput = {
        x: normalizedDx,
        y: normalizedDy
    };

    game.player.direction = angle;
}

function handleTouchEnd() {
    joystickActive = false;
    game.joystickInput = null;

    // Knob'u merkeze geri getir
    joystickKnob.style.transform = 'translate(-50%, -50%)';

    // Joystick'i gizle
    const joystickContainer = document.getElementById('joystick-container');
    // Tek satırda konum gizlemek ufak bir optimizasyon olabilir
    joystickContainer.style.left = joystickContainer.style.top = '-1000px';
}
