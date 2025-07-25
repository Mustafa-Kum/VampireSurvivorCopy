// Tekrarlı kullanılan sabitleri en başta tanımlayalım
const TWO_PI = Math.PI * 2;

// Sık kullanılan değerleri global scope'da önbelleğe alalım
const DEFAULT_COLORS = {
    victory: '#FFD700',
    sparkle: ['#FFD700', '#FFA500', '#FF4500'],
    teleport: '#4169E1',
    enemy: '#800000',
    player: '#00FF00'
};

// Sık kullanılan gradient renkleri önbelleğe alalım
const GRADIENTS = {
    energy: {
        start: 'rgba(255,255,200,0.8)',
        end: 'rgba(255,100,0,0)'
    },
    explosion: {
        start: 'rgba(255,255,255,0.8)',
        middle: 'rgba(255,200,0,0.6)',
        end: 'rgba(255,100,0,0)'
    }
};

function createExplosionEffect(x, y, radius) {
    // Ana patlama dalgası
    for (let i = 0; i < 3; i++) {
        const wave = gameObjectPools.get('fireballWave');
        wave.x = x;
        wave.y = y;
        wave.size = 0;
        wave.maxSize = radius * (2.5 - i * 0.2);
        wave.life = 1;
        wave.decay = 0.02 + i * 0.005;
        wave.color = `rgba(255, ${150 + i * 30}, 0, ${0.5 - i * 0.1})`;
        wave.active = true;

        game.bulletParticles.push(wave);
    }

    // Ateş parçacıkları
    const particleCount = 9;
    for (let i = 0; i < particleCount; i++) {
        // Math.cos(angle) ve Math.sin(angle) tekrarlarını azaltmak için lokal değişkenlere atıyoruz
        const baseAngle = (i / particleCount) * TWO_PI;
        const randomOffset = Math.random() * 0.2;
        const angle = baseAngle + randomOffset;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const speed = Math.random() * 4 + 5;
        const size = Math.random() * 6 + 4;

        const particle = gameObjectPools.get('fireballParticle');
        particle.x = x + cosA * (radius * 0.2);
        particle.y = y + sinA * (radius * 0.2);
        particle.vx = cosA * speed;
        particle.vy = sinA * speed;
        // Geriye doğru hafif ivme
        const cosAPlusPI = Math.cos(angle + Math.PI);
        const sinAPlusPI = Math.sin(angle + Math.PI);
        particle.ax = cosAPlusPI * 0.15;
        particle.ay = sinAPlusPI * 0.15;

        particle.size = size;
        particle.originalSize = size;
        particle.active = true;

        game.bulletParticles.push(particle);
    }

    const wave = gameObjectPools.get('explosionParticle');
    wave.x = x;
    wave.y = y;
    wave.radius = 0;
    wave.maxRadius = radius;
    wave.color = 'rgba(255, 150, 0, 0.5)';
    wave.opacity = 1;
    wave.expansionSpeed = radius * 2;
    wave.active = true;

    particles.push(wave);

    // Kıvılcım parçacıkları
    for (let i = 0; i < 6; i++) {
        const sparkParticle = gameObjectPools.get('basicParticle');
        const angle = (i / 6) * TWO_PI;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        sparkParticle.x = x;
        sparkParticle.y = y;
        sparkParticle.speedX = cosA * (Math.random() * 5 + 3);
        sparkParticle.speedY = sinA * (Math.random() * 5 + 3);
        sparkParticle.color = '#FFA500';
        sparkParticle.size = Math.random() * 4 + 2;
        sparkParticle.life = 1.0;
        sparkParticle.active = true;

        particles.push(sparkParticle);
    }
}

function createLightningEffect(startX, startY, endX, endY) {
    const lightning = {
        startX,
        startY,
        endX,
        endY,
        progress: 0,
        segments: [],
        alpha: 1,
        speed: 15
    };

    const points = generateLightningPoints(startX, startY, endX, endY);
    lightning.segments = points;

    activeLightnings.push(lightning);

    // Ek olarak particle efektleri için pooling kullanalım
    const particleCount = 5;
    const angle = Math.atan2(endY - startY, endX - startX);
    // distance değişkeni ileride başka bir yerde kullanılabilir, bu yüzden koruyoruz
    const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

    for (let i = 0; i < particleCount; i++) {
        const particle = gameObjectPools.get('chainLightningParticle');
        const t = i / particleCount;

        particle.x = startX + (endX - startX) * t + (Math.random() - 0.5) * 20;
        particle.y = startY + (endY - startY) * t + (Math.random() - 0.5) * 20;
        particle.size = Math.random() * 3 + 2;
        particle.opacity = 1;
        particle.life = 1.0;
        particle.decay = 0.05;
        particle.active = true;
        particle.color = 'rgba(100, 180, 255, 0.8)';

        if (!game.activeLightningParticles) {
            game.activeLightningParticles = [];
        }
        game.activeLightningParticles.push(particle);
    }

    // Spark parçacıkları
    for (let i = 0; i < 2; i++) {
        const sparkParticle = gameObjectPools.get('basicParticle');
        const sparkAngle = angle + (Math.random() - 0.5) * Math.PI;
        const sparkDist = Math.random() * 30;
        const cosA = Math.cos(sparkAngle);
        const sinA = Math.sin(sparkAngle);

        sparkParticle.x = startX + cosA * sparkDist;
        sparkParticle.y = startY + sinA * sparkDist;
        sparkParticle.speedX = cosA * (Math.random() * 3 + 2);
        sparkParticle.speedY = sinA * (Math.random() * 3 + 2);
        sparkParticle.size = Math.random() * 2 + 1;
        sparkParticle.color = 'rgba(180, 230, 255, 0.9)';
        sparkParticle.life = 1.0;
        sparkParticle.fadeSpeed = 0.03;
        sparkParticle.active = true;

        particles.push(sparkParticle);
    }
}

function generateLightningPoints(startX, startY, endX, endY) {
    const points = [];
    const segments = 8;
    const offsetAmount = 30;

    points.push({ x: startX, y: startY });

    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const x = startX + (endX - startX) * t + (Math.random() - 0.5) * offsetAmount;
        const y = startY + (endY - startY) * t + (Math.random() - 0.5) * offsetAmount;
        points.push({ x, y });
    }

    points.push({ x: endX, y: endY });
    return points;
}

function createFrostExplosionEffect(x, y, radius) {
    const pool = game.objectPools;
    if (!pool) {
        console.error('Object pools are not defined');
        return;
    }

    // Ana patlama dalgası
    for (let i = 0; i < 3; i++) {
        const wave = pool.get('frostboltWave');
        if (!wave) {
            console.error('Could not retrieve frostboltWave from pool');
            continue;
        }
        wave.x = x;
        wave.y = y;
        wave.size = 0;
        wave.maxSize = radius * (2.5 - i * 0.2);
        wave.life = 1;
        wave.decay = 0.02 + i * 0.005;
        wave.color = `rgba(224, 247, 255, ${0.5 - i * 0.1})`; // Frost renkleri
        wave.active = true;

        game.bulletParticles.push(wave);
    }

    // Frost parçacıkları
    const particleCount = 35;
    for (let i = 0; i < particleCount; i++) {
        const baseAngle = (i / particleCount) * TWO_PI;
        const randomOffset = Math.random() * 0.2;
        const angle = baseAngle + randomOffset;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const speed = Math.random() * 4 + 5;
        const size = Math.random() * 6 + 4;

        const particle = pool.get('frostboltParticle');
        if (!particle) {
            console.error('Could not retrieve frostboltParticle from pool');
            continue;
        }
        particle.x = x + cosA * (radius * 0.2);
        particle.y = y + sinA * (radius * 0.2);
        particle.vx = cosA * speed;
        particle.vy = sinA * speed;

        const cosAPlusPI = Math.cos(angle + Math.PI);
        const sinAPlusPI = Math.sin(angle + Math.PI);
        particle.ax = cosAPlusPI * 0.15;
        particle.ay = sinAPlusPI * 0.15;

        particle.size = size;
        particle.originalSize = size;
        particle.color = `rgba(224, 247, 255, 0.9)`; // Frost renkleri
        particle.active = true;

        game.bulletParticles.push(particle);
    }
}

function createVictoryPattern(number, color = '7fbf7f') {
    // Varsayılan renk ekliyoruz
    const svgString = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\
<rect width="100" height="100" fill="%23${color}"/>\
<rect x="1.5" y="1.5" width="97" height="97" rx="0" \
fill="%23${getLighterColor(color)}" stroke="%23050505" stroke-width="1" opacity="0.5"/>\
<circle cx="10" cy="10" r="3" fill="%23ffffff" opacity="0.4"/>\
<circle cx="90" cy="10" r="3" fill="%23ffffff" opacity="0.4"/>\
<circle cx="10" cy="90" r="3" fill="%23ffffff" opacity="0.4"/>\
<circle cx="90" cy="90" r="3" fill="%23ffffff" opacity="0.4"/>\
<text x="50" y="55" font-size="20" text-anchor="middle" fill="%23ffffff" opacity="0.6">${number}</text>\
</svg>`;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = svgString;
    });
}

function getLighterColor(color) {
    if (!color) return 'ffffff'; // Eğer renk undefined ise varsayılan beyaz renk döndür

    return color.replace(/[0-9a-f]{2}/g, function(hex) {
        let val = Math.min(parseInt(hex, 16) * 1.2, 255);
        return Math.floor(val).toString(16).padStart(2, '0');
    });
}

function createSparkleEffect(x, y) {
    const sparkleCount = 6; // 8'den 6'ya düşürüldü
    const colors = DEFAULT_COLORS.sparkle;
    const colorCount = colors.length;
    
    // Fragment oluşturmayı optimize et
    const fragment = document.createDocumentFragment();
    const angleStep = TWO_PI / sparkleCount;

    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'particle sparkle';
        
        // Style özelliklerini tek seferde set et
        Object.assign(sparkle.style, {
            left: `${x}px`,
            top: `${y}px`,
            backgroundColor: colors[i % colorCount],
            width: '4px',
            height: '4px'
        });

        fragment.appendChild(sparkle);
        
        // setTimeout yerine requestAnimationFrame kullanalım
        const start = performance.now();
        const animate = (timestamp) => {
            if (timestamp - start >= 400) { // 500ms'den 400ms'e düşürüldü
                sparkle.remove();
                return;
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    document.body.appendChild(fragment);
}

function createTeleportEffect(x, y) {
    // Sabit değerler ve optimizasyonlar
    const baseSpeed = 0.8;
    const gravityEffect = 0.02;
    const fadeSpeed = 0.02;
    const rotationSpeed = 0.05;
    const distance = 15;
    const particleCount = 3; // 4'ten 3'e düşürüldü

    // TWO_PI/particleCount değerini önbelleğe al
    const angleStep = TWO_PI / particleCount;

    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleStep;
        // Tek seferde cos/sin hesapla
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const particle = gameObjectPools.get('teleportParticle');
        // x,y hesaplamalarını optimize et
        const offsetX = cosA * distance;
        const offsetY = sinA * distance;
        
        particle.x = x + offsetX;
        particle.y = y + offsetY;
        particle.color = '#4169E1';
        particle.speedX = cosA * baseSpeed;
        particle.speedY = sinA * baseSpeed;
        particle.size = Math.random() * 2 + 2; // Boyut aralığını daralt
        particle.gravity = gravityEffect;
        particle.life = 1.0;
        particle.fadeSpeed = fadeSpeed + Math.random() * 0.01; // Random aralığını daralt
        particle.rotation = Math.random() * TWO_PI;
        particle.rotationSpeed = (Math.random() - 0.5) * rotationSpeed;
        particle.active = true;

        particles.push(particle);
    }
}

function createPortalEffect(x, y) {
    const particleCount = 6; // 8'den 6'ya düşürüldü
    const angleStep = TWO_PI / particleCount;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleStep;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const speed = Math.random() * 2 + 2; // Hız aralığını daralt

        const particle = createParticle(x, y, '#FFD700');
        particle.speedX = cosA * speed;
        particle.speedY = sinA * speed;
        particles.push(particle);
    }
}

function createSparkles(x, y, color = '#FFD700', count = 2) {
    // DocumentFragment ile DOM'a tek seferde ekleme
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * TWO_PI;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const distance = Math.random() * 30 + 20;

        const sparkle = {
            x: x + cosA * distance,
            y: y + sinA * distance,
            size: Math.random() * 4 + 2,
            angle: angle,
            life: 1,
            color: color
        };

        const sparkleElement = document.createElement('div');
        sparkleElement.className = 'sparkle';
        sparkleElement.style.left = sparkle.x + 'px';
        sparkleElement.style.top = sparkle.y + 'px';
        sparkleElement.style.backgroundColor = sparkle.color;

        fragment.appendChild(sparkleElement);

        setTimeout(() => sparkleElement.remove(), 1000);
    }

    document.body.appendChild(fragment);
}

function createVictoryEffect(x, y) {
    const sparkCount = 4; // 5'ten 4'e düşürüldü
    const angleStep = TWO_PI / sparkCount;
    const victoryColor = DEFAULT_COLORS.victory;
    
    // Parlama efekti için tek döngü kullanalım
    for (let i = 0; i < sparkCount; i++) {
        const angle = i * angleStep;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const distance = 40; // 50'den 40'a düşürüldü

        const particle = gameObjectPools.get('sparkleParticle');
        Object.assign(particle, {
            x: x + cosA * distance,
            y: y + sinA * distance,
            size: Math.random() * 3 + 2, // 4+2'den 3+2'ye düşürüldü
            angle,
            life: 1,
            color: victoryColor,
            active: true,
            fadeSpeed: 0.03 // Daha hızlı kaybolma
        });

        particles.push(particle);
    }

    // Yıldız patlaması efekti
    const starCount = 2; // 3'ten 2'ye düşürüldü
    const starAngleStep = TWO_PI / starCount;
    
    for (let i = 0; i < starCount; i++) {
        const angle = i * starAngleStep;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const speed = Math.random() * 2 + 2; // 3+2'den 2+2'ye düşürüldü

        const particle = gameObjectPools.get('basicParticle');
        Object.assign(particle, {
            x, y,
            speedX: cosA * speed,
            speedY: sinA * speed,
            color: victoryColor,
            size: Math.random() * 2 + 2,
            life: 1.0,
            fadeSpeed: 0.03,
            active: true
        });

        particles.push(particle);
    }

    // Dalgalı efekt optimizasyonu
    const wave = gameObjectPools.get('explosionParticle');
    Object.assign(wave, {
        x, y,
        radius: 0,
        maxRadius: 80, // 100'den 80'e düşürüldü
        color: 'rgba(255, 215, 0, 0.3)',
        opacity: 1,
        expansionSpeed: 150, // 200'den 150'ye düşürüldü
        active: true
    });

    particles.push(wave);

    // Ses efekti için direkt çağrı
    playStarEarnedSound?.();
}

function createDeathParticles(x, y, isEnemy = true) {
    const particleCount = isEnemy ? 2 : 4; // Daha da azalttık
    const baseColor = isEnemy ? DEFAULT_COLORS.enemy : DEFAULT_COLORS.player;
    const colors = [baseColor, '#FF0000'];  // Renk sayısını 2'ye düşürdük

    const angleStep = TWO_PI / particleCount;
    const baseSpeed = 1.2; // 1.5'ten düşürüldü
    const fadeSpeed = 0.03; // Daha hızlı kaybolma

    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleStep;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        
        const particle = gameObjectPools.get('deathParticle');
        Object.assign(particle, {
            x, y,
            color: colors[i % 2],
            size: Math.random() * 2 + 1.5,
            speedX: cosA * baseSpeed,
            speedY: sinA * baseSpeed,
            gravity: 0.02,
            life: 1.0,
            fadeSpeed: fadeSpeed + Math.random() * 0.01,
            rotation: angle,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            active: true
        });

        particles.push(particle);
    }
}

function drawEnergyParticles(ctx, time, baseRadius) {
    const particleCount = 3; // 4'ten 3'e düşürüldü
    const angleStep = TWO_PI / particleCount;
    const timeMultiplier = time * 3;
    const sizeBase = baseRadius * 0.12; // 0.15'ten düşürüldü

    // Gradient renkleri
    const { start, end } = GRADIENTS.energy;

    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleStep + time;
        const sinOffset = Math.sin(timeMultiplier + i);
        
        // Tek seferde trigonometrik hesaplamalar
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        
        const distance = baseRadius * (1.1 + sinOffset * 0.2); // Mesafeyi azalttık
        const x = cosA * distance;
        const y = sinA * distance;
        const size = (sinOffset * 0.4 + 1.2) * sizeBase; // Boyutu azalttık

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, start);
        gradient.addColorStop(1, end);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, TWO_PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}
