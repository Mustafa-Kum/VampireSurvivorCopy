let flashIntensity = 0;
let lastFlashUpdate = 0;

function drawPlayer() {
    // Sık kullanılan sabit değerleri saklayalım
    const now = performance.now();
    const time = now / 1000;
    const fullCircle = Math.PI * 2;
    const halfPi = Math.PI / 2;
    const playerX = game.player.x;
    const playerY = game.player.y;
    const playerSize = game.player.size;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-playerX, -playerY);
    ctx.translate(playerX, playerY);

    // Karakter tipini kontrol et (varsayılan olarak savaşçı)
    const isWizard = game.player.characterType === 'wizard';
    const isArcher = game.player.characterType === 'archer';

    // Chain Lightning yeteneği varsa dönen elektrik efekti çiz
    if (game.playerUpgrades.chainLightning > 0) {
        const orbitRadius = playerSize * 1.4;
        const lightningSize = playerSize * 0.25;
        
        const rotationSpeed = time * 3;
        const orbitX = Math.cos(rotationSpeed) * orbitRadius; 
        const orbitY = Math.sin(rotationSpeed) * orbitRadius;

        ctx.save();
        ctx.translate(orbitX, orbitY);
        ctx.rotate(time * 4);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, lightningSize);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, 'rgba(100, 180, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, lightningSize, 0, fullCircle);
        ctx.fill();
        
        const arcCount = 8;
        for (let i = 0; i < arcCount; i++) {
            const arcAngle = (i / arcCount) * fullCircle + time * 5;
            const sinVal = Math.sin(time * 10 + i);
            const arcLength = lightningSize * (1.2 + sinVal * 0.3);

            ctx.strokeStyle = 'rgba(150, 220, 255, ' + (0.6 + sinVal * 0.4) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            let x = Math.cos(arcAngle) * arcLength;
            let y = Math.sin(arcAngle) * arcLength;
            const segments = 3;
            let currentX = 0, currentY = 0;
            
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const nextX = x * t;
                const nextY = y * t;
                const offset = (Math.random() - 0.5) * 5;
                ctx.lineTo(
                    currentX + (nextX - currentX) / 2 + offset,
                    currentY + (nextY - currentY) / 2 + offset
                );
                currentX = nextX;
                currentY = nextY;
            }
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // Frostbolt yeteneği varsa dönen buz efekti çiz
    if (game.playerUpgrades.frostbolt > 0) {
        const orbitRadius = playerSize * 1.2;
        const frostboltSize = playerSize * 0.3;
        
        // Frostbolt'un pozisyonunu hesapla (fireball'un tersi yönde dönsün)
        const rotationSpeed = time * 2;
        const orbitX = Math.cos(-rotationSpeed) * orbitRadius;
        const orbitY = Math.sin(-rotationSpeed) * orbitRadius;
        
        ctx.save();
        ctx.translate(orbitX, orbitY);
        ctx.rotate(-time * 3);
        
        // Buz efekti
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, frostboltSize);
        gradient.addColorStop(0, 'rgba(200, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, frostboltSize, 0, fullCircle);
        ctx.fill();
        
        // Kristal parıltı efekti
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
            const sparkAngle = (i / sparkCount) * fullCircle + time * 4;
            const sparkDist = frostboltSize * 0.8;
            const sparkX = Math.cos(sparkAngle) * sparkDist;
            const sparkY = Math.sin(sparkAngle) * sparkDist;
            
            ctx.fillStyle = 'rgba(220, 240, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, frostboltSize * 0.15, 0, fullCircle);
            ctx.fill();
        }
        
        ctx.restore();
    }

    // Fireball yeteneği varsa dönen ateş efekti çiz
    if (game.playerUpgrades.fireball > 0) {
        const orbitRadius = playerSize * 1.2;
        const fireballSize = playerSize * 0.3;
        
        // Fireball'un pozisyonunu hesapla
        const rotationSpeed = time * 2;
        const orbitX = Math.cos(rotationSpeed) * orbitRadius;
        const orbitY = Math.sin(rotationSpeed) * orbitRadius;
        
        ctx.save();
        ctx.translate(orbitX, orbitY);
        ctx.rotate(time * 3);
        
        // Ateş efekti
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, fireballSize);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, fireballSize, 0, fullCircle);
        ctx.fill();
        
        // Parıltı efekti
        const sparkCount = 4;
        for (let i = 0; i < sparkCount; i++) {
            const sparkAngle = (i / sparkCount) * fullCircle + time * 4;
            const sparkDist = fireballSize * 0.8;
            const sparkX = Math.cos(sparkAngle) * sparkDist;
            const sparkY = Math.sin(sparkAngle) * sparkDist;
            
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, fireballSize * 0.2, 0, fullCircle);
            ctx.fill();
        }
        
        ctx.restore();
    }

    // Tüm hareket yönlerini kontrol edelim
    const isMoving = game.keys.w || game.keys.s || game.keys.a || game.keys.d ||
        game.keys.arrowup || game.keys.arrowdown ||
        game.keys.arrowleft || game.keys.arrowright ||
        (game.joystickInput && (game.joystickInput.x !== 0 || game.joystickInput.y !== 0)) ||
        game.isMouseDown;

    // Hareket varsa hafif sağa/sola salınım ekle
    const sideSwayOffset = isMoving ? Math.sin(now / 150) * 2 : 0;
    ctx.translate(sideSwayOffset, 0);

    // 2048 stil özellikleri
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    if (game.player.invulnerable || immortalityCheckbox.checked) {
        ctx.globalAlpha = 0.5 + Math.sin(now / 100) * 0.5;
    }

    if (isWizard) {
        // Gandalf büyücü çizimi - geliştirilmiş versiyon
const wizardRobeColor = rgbToString(interpolateColor([235, 240, 250], [255, 255, 255], flashIntensity));
const wizardSilverColor = rgbToString(interpolateColor([180, 190, 210], [255, 255, 255], flashIntensity));
const wizardGrayColor = rgbToString(interpolateColor([210, 215, 225], [255, 255, 255], flashIntensity));
const wizardHatColor = rgbToString(interpolateColor([60, 75, 95], [255, 255, 255], flashIntensity));
const accentBlue = rgbToString(interpolateColor([147, 197, 253], [255, 255, 255], flashIntensity));

// Cübbe arka pelerini
ctx.fillStyle = wizardRobeColor;
ctx.beginPath();
ctx.moveTo(0, -playerSize/2);
ctx.quadraticCurveTo(
   -playerSize * 0.9, -playerSize * 0.2,
   -playerSize * 0.7, playerSize * 0.2
);
ctx.quadraticCurveTo(
   -playerSize * 0.6, playerSize * 0.6,  
   -playerSize * 0.5, playerSize
);
ctx.lineTo(playerSize * 0.5, playerSize);
ctx.quadraticCurveTo(
   playerSize * 0.6, playerSize * 0.6,
   playerSize * 0.7, playerSize * 0.2  
);
ctx.quadraticCurveTo(
   playerSize * 0.9, -playerSize * 0.2,
   0, -playerSize/2
);
ctx.fill();
ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
ctx.stroke();

// Geliştirilmiş pelerin kıvrımları ve dokusu 
const cloakShadow = ctx.createLinearGradient(0, -playerSize/2, 0, playerSize);
cloakShadow.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
cloakShadow.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
ctx.fillStyle = cloakShadow;
ctx.fill();

for (let i = 1; i <= 5; i++) {
   const wave = Math.sin(now / 1000 + i * 0.5) * playerSize * 0.02;
   ctx.beginPath();
   ctx.moveTo(-playerSize * 0.5, playerSize * 0.2 * i);
   ctx.quadraticCurveTo(
       0 + wave, playerSize * (0.1 + 0.2 * i),
       playerSize * 0.5, playerSize * 0.2 * i
   );
   ctx.strokeStyle = `rgba(59, 83, 104, ${0.3 + i * 0.05})`;
   ctx.lineWidth = 2;
   ctx.stroke();
}

// Ana cübbe
ctx.fillStyle = wizardGrayColor;
ctx.beginPath();
ctx.rect(-playerSize/3, -playerSize/2, playerSize * 2/3, playerSize);
ctx.fill();
ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
ctx.stroke();

// Geliştirilmiş cübbe dokusu
for (let i = 0; i < 12; i++) {
   const wave = Math.sin(now / 800 + i) * playerSize * 0.01;
   ctx.beginPath();
   ctx.moveTo(-playerSize/3 + (playerSize * 2/3 * i/12), -playerSize/2);
   ctx.quadraticCurveTo(
       -playerSize/3 + (playerSize * 2/3 * i/12) + wave,
       0,
       -playerSize/3 + (playerSize * 2/3 * i/12),
       playerSize/2
   );
   ctx.strokeStyle = 'rgba(59, 83, 104, 0.15)';
   ctx.stroke();
}

// Yüz
ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
ctx.beginPath();
ctx.arc(0, -playerSize/4, playerSize/3, 0, Math.PI * 2);
ctx.fill();
ctx.strokeStyle = 'rgba(59, 83, 104, 0.3)';
ctx.stroke();

// Geliştirilmiş gözler
const eyeBaseColor = '#4A90E2';
const eyeGlow = ctx.createRadialGradient(
   -playerSize/6, -playerSize/4, 0,
   -playerSize/6, -playerSize/4, playerSize/8
);
eyeGlow.addColorStop(0, `rgba(147, 197, 253, ${0.8 + Math.sin(now/500) * 0.2})`);
eyeGlow.addColorStop(0.5, 'rgba(147, 197, 253, 0.4)');
eyeGlow.addColorStop(1, 'rgba(147, 197, 253, 0)');

// Her iki göz için
[-playerSize/6, playerSize/6].forEach(eyeX => {
    ctx.fillStyle = eyeBaseColor;
    ctx.beginPath();
    ctx.arc(eyeX, -playerSize/4, playerSize/12, 0, Math.PI * 2);
    ctx.fill();

    // Göz bebeği
    ctx.fillStyle = '#1B3F5E';
    ctx.beginPath();
    ctx.arc(eyeX, -playerSize/4, playerSize/24, 0, Math.PI * 2);
    ctx.fill();

    // Göz parıltısı
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(eyeX, -playerSize/4, playerSize/8, 0, Math.PI * 2);
    ctx.fill();
});

// Göz üstü parıltısı
ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
ctx.beginPath();
ctx.arc(-playerSize/6 - playerSize/24, -playerSize/4 - playerSize/24, playerSize/48, 0, Math.PI * 2);
ctx.arc(playerSize/6 - playerSize/24, -playerSize/4 - playerSize/24, playerSize/48, 0, Math.PI * 2);
ctx.fill();

// Kaşlar
ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(-playerSize/4, -playerSize/3);
ctx.quadraticCurveTo(-playerSize/6, -playerSize/3.2, -playerSize/8, -playerSize/3);
ctx.moveTo(playerSize/4, -playerSize/3);
ctx.quadraticCurveTo(playerSize/6, -playerSize/3.2, playerSize/8, -playerSize/3);
ctx.stroke();

// Geliştirilmiş sakal
const beardWaveIntensity = Math.sin(now / 800) * 0.1;
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.beginPath();
ctx.moveTo(-playerSize/3, -playerSize/6);
ctx.quadraticCurveTo(
   0, playerSize * 0.7 + beardWaveIntensity,
   playerSize/3, -playerSize/6
);
ctx.fill();
ctx.stroke();

// Sakal dalgaları
for (let i = 1; i <= 6; i++) {
   ctx.beginPath();
   ctx.moveTo(-playerSize/3 + (i * playerSize/14), -playerSize/6);
   ctx.quadraticCurveTo(
       0 + Math.sin(now / 600 + i) * playerSize * 0.05,
       playerSize * (0.3 + i * 0.1 + beardWaveIntensity),
       playerSize/3 - (i * playerSize/14), -playerSize/6
   );
   ctx.strokeStyle = `rgba(200, 200, 200, ${0.3 + i * 0.05})`;
   ctx.lineWidth = 1 + Math.sin(now / 400 + i) * 0.5;
   ctx.stroke();
}

// Büyücü şapkası
ctx.fillStyle = wizardHatColor;
ctx.beginPath();
ctx.moveTo(-playerSize/2, -playerSize/4);
const hatHeight = -playerSize * 1.4 + Math.sin(now / 1000) * playerSize * 0.05;
ctx.quadraticCurveTo(
   0, hatHeight,
   playerSize/2, -playerSize/4
);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Şapka kıvrımları
for (let i = 1; i <= 5; i++) {
   const wave = Math.sin(now / 700 + i) * playerSize * 0.02;
   ctx.beginPath();
   ctx.moveTo(-playerSize/2 + (i * playerSize/8), -playerSize/4);
   ctx.quadraticCurveTo(
       0 + wave, -playerSize * (1.2 - i * 0.1),
       playerSize/2 - (i * playerSize/8), -playerSize/4
   );
   ctx.strokeStyle = 'rgba(59, 83, 104, 0.3)';
   ctx.stroke();
}

// Şapka bandı
ctx.fillStyle = wizardSilverColor;
ctx.beginPath();
ctx.rect(-playerSize/2, -playerSize/4, playerSize, playerSize/8);
ctx.fill();
ctx.stroke();

// Geliştirilmiş yıldız süsü
const starPoints = 5;
const starSize = playerSize/12;
const starPulse = Math.sin(now / 500) * 0.2 + 0.8;
ctx.fillStyle = `rgba(255, 255, 255, ${starPulse})`;
ctx.beginPath();
for (let i = 0; i < starPoints * 2; i++) {
   const radius = i % 2 === 0 ? starSize : starSize/2;
   const angle = (i * Math.PI) / starPoints + now / 1000;
   const x = Math.cos(angle) * radius;
   const y = Math.sin(angle) * radius;
   if (i === 0) {
       ctx.moveTo(x, -playerSize/4 + playerSize/16 + y);
   } else {
       ctx.lineTo(x, -playerSize/4 + playerSize/16 + y);
   }
}
ctx.closePath();
ctx.fill();
ctx.stroke();

// Geliştirilmiş asa
const staffSwayAngle = Math.sin(now / 1000) * 0.1;
ctx.save();
ctx.translate(playerSize/2, 0);
ctx.rotate(staffSwayAngle);

// Asa gövdesi
const staffGradient = ctx.createLinearGradient(0, -playerSize * 0.8, 0, playerSize/2);
staffGradient.addColorStop(0, '#8B4513');
staffGradient.addColorStop(0.5, '#A0522D');
staffGradient.addColorStop(1, '#8B4513');

ctx.strokeStyle = staffGradient;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(0, -playerSize * 0.8);
ctx.lineTo(0, playerSize/2);
ctx.stroke();

// Geliştirilmiş asa oymaları
for (let i = 1; i <= 5; i++) {
   const rotationAngle = now / 1000 + i;
   ctx.beginPath();
   ctx.arc(0, -playerSize * 0.6 + i * playerSize/6, 
           playerSize/30 + Math.sin(rotationAngle) * playerSize/100, 
           0, Math.PI * 2);
   ctx.strokeStyle = '#6B4423';
   ctx.lineWidth = 2;
   ctx.stroke();
}

// Geliştirilmiş asa kristali
const crystalPulse = Math.sin(now / 500) * 0.2 + 0.8;
const crystalGlow = ctx.createRadialGradient(
   0, -playerSize * 0.8, 0,
   0, -playerSize * 0.8, playerSize/3
);
crystalGlow.addColorStop(0, `rgba(255, 255, 255, ${crystalPulse})`);
crystalGlow.addColorStop(0.2, `rgba(147, 197, 253, ${crystalPulse * 0.8})`);
crystalGlow.addColorStop(0.5, `rgba(192, 203, 220, ${crystalPulse * 0.6})`);
crystalGlow.addColorStop(1, 'rgba(59, 83, 104, 0)');

ctx.fillStyle = crystalGlow;
ctx.beginPath();
ctx.arc(0, -playerSize * 0.8, playerSize/3, 0, Math.PI * 2);
ctx.fill();

// Geliştirilmiş kristal ışınları
const rayCount = 12;
for (let i = 0; i < rayCount; i++) {
   const rayAngle = (i / rayCount) * Math.PI * 2 + now / 1000;
   const rayLength = playerSize/3 + Math.sin(now / 200 + i) * playerSize/6;
   
   ctx.strokeStyle = `rgba(147, 197, 253, ${0.7 * crystalPulse})`;
   ctx.lineWidth = 2;
   ctx.beginPath();
   ctx.moveTo(
       Math.cos(rayAngle) * playerSize/8,
       -playerSize * 0.8 + Math.sin(rayAngle) * playerSize/8
   );
   ctx.lineTo(
       Math.cos(rayAngle) * rayLength,
       -playerSize * 0.8 + Math.sin(rayAngle) * rayLength
   );
   ctx.stroke();
}

ctx.restore();

// Geliştirilmiş büyü aurası
const auraParticles = 16;
for (let i = 0; i < auraParticles; i++) {
   const time = now / 1000;
   const angle = (time * 0.5 + i * Math.PI * 2/auraParticles) % (Math.PI * 2);
   const pulseOffset = Math.sin(time * 2 + i) * 0.2;
   const distance = playerSize * (0.7 + pulseOffset);
   
   const x = Math.cos(angle) * distance;
   const y = Math.sin(angle) * distance;
   
   // Ana parçacık
   const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, playerSize/12);
   particleGlow.addColorStop(0, `rgba(147, 197, 253, ${0.9 * (1 + pulseOffset)})`);
   particleGlow.addColorStop(0.5, `rgba(192, 203, 220, ${0.5 * (1 + pulseOffset)})`);
  particleGlow.addColorStop(1, 'rgba(59, 83, 104, 0)');
  
  ctx.fillStyle = particleGlow;
  ctx.beginPath();
  ctx.arc(x, y, playerSize/12, 0, Math.PI * 2);
  ctx.fill();
  
  // İz efekti
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
      x - Math.cos(angle) * playerSize * 0.1,
      y - Math.sin(angle) * playerSize * 0.1
  );
  ctx.strokeStyle = `rgba(147, 197, 253, ${0.3 * (1 + pulseOffset)})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Aura ışık halkaları
for (let i = 1; i <= 3; i++) {
  const ringRadius = playerSize * (0.8 + i * 0.1);
  const ringPulse = Math.sin(now / 800 + i) * 0.2 + 0.8;
  
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(147, 197, 253, ${0.2 * ringPulse})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}
    } else if (isArcher) {
        // Legolas tarzı okçu çizimi
const elfGreenColor = rgbToString(interpolateColor([46, 139, 87], [255, 255, 255], flashIntensity));
const elfGoldColor = rgbToString(interpolateColor([218, 165, 32], [255, 255, 255], flashIntensity));
const elfSkinColor = rgbToString(interpolateColor([255, 235, 205], [255, 255, 255], flashIntensity));
const elfHairColor = rgbToString(interpolateColor([250, 214, 165], [255, 255, 255], flashIntensity));

// Elf zırhı - gövde 
const armorGradient = ctx.createLinearGradient(0, -playerSize/2, 0, playerSize/2);
armorGradient.addColorStop(0, elfGreenColor);
armorGradient.addColorStop(0.5, '#355E3B');
armorGradient.addColorStop(1, '#2E5A1C');
ctx.fillStyle = armorGradient;
ctx.beginPath();
ctx.rect(-playerSize/3, -playerSize/2, playerSize * 2/3, playerSize);
ctx.fill();
ctx.stroke();

// Zırh detayları - altın süslemeler
for (let i = 0; i < 4; i++) {
   ctx.beginPath();
   ctx.moveTo(-playerSize/3, -playerSize/2 + i * playerSize/3);
   ctx.lineTo(playerSize/3, -playerSize/2 + i * playerSize/3);
   ctx.strokeStyle = elfGoldColor;
   ctx.lineWidth = 2; 
   ctx.stroke();

   // Dikey süslemeler
   ctx.beginPath();
   ctx.moveTo(-playerSize/6, -playerSize/2 + i * playerSize/3);
   ctx.lineTo(-playerSize/6, -playerSize/2 + (i+1) * playerSize/3);
   ctx.stroke();
}

// Yüz
ctx.fillStyle = elfSkinColor;
ctx.beginPath();
ctx.arc(0, -playerSize/4, playerSize/3, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();

// Gözler
// Ana göz rengi  
const eyeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, playerSize/12);
eyeGradient.addColorStop(0, '#E0FFFF');
eyeGradient.addColorStop(0.7, '#87CEEB');
eyeGradient.addColorStop(1, '#4682B4');

ctx.fillStyle = '#FFFFFF';
ctx.beginPath();
ctx.arc(-playerSize/6, -playerSize/4, playerSize/10, 0, Math.PI * 2);
ctx.arc(playerSize/6, -playerSize/4, playerSize/10, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = eyeGradient;
ctx.beginPath();
ctx.arc(-playerSize/6, -playerSize/4, playerSize/12, 0, Math.PI * 2);
ctx.arc(playerSize/6, -playerSize/4, playerSize/12, 0, Math.PI * 2);
ctx.fill();

// Göz bebekleri
ctx.fillStyle = '#000000';
ctx.beginPath();
ctx.arc(-playerSize/6, -playerSize/4, playerSize/24, 0, Math.PI * 2);
ctx.arc(playerSize/6, -playerSize/4, playerSize/24, 0, Math.PI * 2);
ctx.fill();

// Göz parıltısı
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
ctx.beginPath();
ctx.arc(-playerSize/6 - playerSize/24, -playerSize/4 - playerSize/24, playerSize/48, 0, Math.PI * 2);
ctx.arc(playerSize/6 - playerSize/24, -playerSize/4 - playerSize/24, playerSize/48, 0, Math.PI * 2);
ctx.fill();

// Elf kulakları
ctx.fillStyle = elfSkinColor;
// Sol kulak
ctx.beginPath();
ctx.moveTo(-playerSize/3, -playerSize/4);
ctx.quadraticCurveTo(
   -playerSize/2, -playerSize/4,
   -playerSize/2, -playerSize/3
);
ctx.lineTo(-playerSize/3, -playerSize/6);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Sağ kulak
ctx.beginPath();
ctx.moveTo(playerSize/3, -playerSize/4);
ctx.quadraticCurveTo(
   playerSize/2, -playerSize/4,
   playerSize/2, -playerSize/3
);
ctx.lineTo(playerSize/3, -playerSize/6);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Saçlar - daha doğal görünüm
ctx.fillStyle = elfHairColor;
// Ön saç
ctx.beginPath();
ctx.moveTo(-playerSize/3, -playerSize/3);
ctx.quadraticCurveTo(
   0, -playerSize/2,
   playerSize/3, -playerSize/3
);
ctx.lineTo(playerSize/3, -playerSize/4);
ctx.lineTo(-playerSize/3, -playerSize/4);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Geliştirilmiş saç örgüleri
for (let i = -1; i <= 1; i += 2) {
   ctx.beginPath();
   let x = playerSize/4 * i;
   let prevX = x;
   ctx.moveTo(x, -playerSize/3);
   
   for (let j = 0; j < 4; j++) {
       const controlX = prevX + (playerSize/6 * i);
       const controlY = -playerSize/4 + j * playerSize/5;
       const endX = prevX + (playerSize/8 * i * Math.pow(-1, j));
       const endY = -playerSize/6 + j * playerSize/4;
       
       ctx.quadraticCurveTo(controlX, controlY, endX, endY);
       prevX = endX;
   }
   ctx.stroke();
}

// Yay animasyonu
const bowSwayAngle = Math.sin(now / 1000) * 0.1;
ctx.save();
ctx.translate(playerSize/2, 0);
ctx.rotate(bowSwayAngle);

// Yay gövdesi
const bowGradient = ctx.createLinearGradient(-5, 0, 5, 0);
bowGradient.addColorStop(0, elfGoldColor);
bowGradient.addColorStop(0.5, '#B8860B');
bowGradient.addColorStop(1, elfGoldColor);

ctx.strokeStyle = bowGradient;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(0, -playerSize * 0.7);
ctx.quadraticCurveTo(playerSize/3, 0, 0, playerSize * 0.7);
ctx.stroke();

// Yay ipi
ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(0, -playerSize * 0.7);
ctx.lineTo(-playerSize/6, 0);
ctx.lineTo(0, playerSize * 0.7);
ctx.stroke();

ctx.restore();
    } else {
        // Şövalye karakter çizimi
        const knightMainColor = rgbToString(interpolateColor([192, 192, 192], [255, 255, 255], flashIntensity));
        const knightArmorColor = rgbToString(interpolateColor([128, 128, 128], [255, 255, 255], flashIntensity));
        const knightCapeColor = rgbToString(interpolateColor([140, 0, 0], [255, 255, 255], flashIntensity));
        const knightSkinColor = rgbToString(interpolateColor([233, 194, 166], [255, 255, 255], flashIntensity));
        
        // Ana miğfer gövdesi
ctx.fillStyle = knightArmorColor;
ctx.beginPath();
ctx.moveTo(-playerSize/2.2, -playerSize/1.1);
ctx.quadraticCurveTo(
    0, -playerSize/0.85,
    playerSize/2.2, -playerSize/1.1
);
ctx.lineTo(playerSize/2.2, -playerSize/1.4);
ctx.quadraticCurveTo(
    0, -playerSize/1.2,
    -playerSize/2.2, -playerSize/1.4
);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Miğfer vizörü
ctx.beginPath();
ctx.moveTo(-playerSize/3, -playerSize/1.15);
ctx.lineTo(playerSize/3, -playerSize/1.15);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(-playerSize/3.2, -playerSize/1.22);
ctx.lineTo(playerSize/3.2, -playerSize/1.22);
ctx.stroke();

// Miğfer tepesi süslemesi (tüy)
ctx.fillStyle = knightCapeColor;
ctx.beginPath();
ctx.moveTo(0, -playerSize/0.85);
ctx.quadraticCurveTo(
    playerSize/4, -playerSize/0.7,
    playerSize/2, -playerSize/0.9
);
ctx.quadraticCurveTo(
    playerSize/4, -playerSize/0.8,
    0, -playerSize/0.85
);
ctx.fill();
ctx.stroke();

// Miğfer detayları
ctx.beginPath();
ctx.moveTo(-playerSize/2.5, -playerSize/1.25);
ctx.quadraticCurveTo(
    -playerSize/3, -playerSize/1.3,
    -playerSize/3, -playerSize/1.15
);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(playerSize/2.5, -playerSize/1.25);
ctx.quadraticCurveTo(
    playerSize/3, -playerSize/1.3,
    playerSize/3, -playerSize/1.15
);
ctx.stroke();

// Miğfer perçinleri
for(let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(i * playerSize/6, -playerSize/1.3, playerSize/40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}
        
        // Pelerin
        ctx.fillStyle = knightCapeColor;
        ctx.beginPath();
        ctx.moveTo(0, -playerSize/2);
        ctx.quadraticCurveTo(
            -playerSize * 0.8, playerSize/4,
            -playerSize * 0.6, playerSize/2
        );
        ctx.lineTo(playerSize * 0.6, playerSize/2);
        ctx.quadraticCurveTo(
            playerSize * 0.8, playerSize/4,
            0, -playerSize/2
        );
        ctx.fill();
        ctx.stroke();
     
        // Zırh gövdesi
        ctx.fillStyle = knightArmorColor;
        ctx.beginPath();
        ctx.moveTo(-playerSize/3, -playerSize/2);
        ctx.lineTo(playerSize/3, -playerSize/2);
        ctx.lineTo(playerSize/2, 0);
        ctx.lineTo(playerSize/3, playerSize/2);
        ctx.lineTo(-playerSize/3, playerSize/2);
        ctx.lineTo(-playerSize/2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
     
        // Omuz zırhları
        ctx.beginPath();
        ctx.arc(-playerSize/2, -playerSize/3, playerSize/4, 0, Math.PI * 2);
        ctx.arc(playerSize/2, -playerSize/3, playerSize/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
     
        // Yüz
        ctx.fillStyle = knightSkinColor;
        ctx.beginPath();
        ctx.arc(0, -playerSize/1.2, playerSize/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
     
        // Gözler
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-playerSize/8, -playerSize/1.2, playerSize/14, 0, Math.PI * 2);
        ctx.arc(playerSize/8, -playerSize/1.2, playerSize/14, 0, Math.PI * 2);
        ctx.fill();
     
        // Kılıç animasyonu
        const swordSwayAngle = isMoving ? Math.sin(now / 200) * 0.15 : 0;
     
        // Kılıç çizimi
        ctx.save();
        ctx.translate(playerSize/2, 0);
        ctx.rotate(swordSwayAngle + Math.PI * 0.2);
     
        // Kılıç kabzası
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-4, -15, 8, 30);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(-4, -15, 8, 30);
     
        // Kılıç siperi
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-15, -2, 30, 4);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(-15, -2, 30, 4);
     
        // Kılıç gövdesi
        ctx.strokeStyle = knightMainColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(playerSize/2 + 20, -4);
        ctx.lineTo(playerSize/2 + 30, 0);
        ctx.lineTo(playerSize/2 + 20, 4);
        ctx.lineTo(0, 4);
        ctx.closePath();
        ctx.fillStyle = '#E8E8E8';
        ctx.fill();
        ctx.stroke();
     
        // Kılıç süslemeleri
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(playerSize/4, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
     
        ctx.restore();
     
        // Zırh detayları
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for(let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-playerSize/3 + (i * playerSize/6), -playerSize/2);
            ctx.lineTo(-playerSize/3 + (i * playerSize/6), playerSize/2);
            ctx.stroke();
        }
     
        // Metal parlaması efekti
        if (isMoving) {
            const shinePoints = 2;
            for (let i = 0; i < shinePoints; i++) {
                const shineTime = ((now + i * 500) % 1000) / 1000;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - shineTime})`;
                ctx.beginPath();
                ctx.arc(
                    -playerSize/6 + (i * playerSize/3),
                    -playerSize/4 + shineTime * playerSize/2,
                    3,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
     }

    // Health bar background
    const barWidth = playerSize * 1.5;
    const barHeight = 4;
    const barY = playerSize / 2 + 10;

    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Health bar background
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

    // Health bar fill
    const healthPercent = game.player.health / getPlayerMaxHealth();
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

    // Health bar border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

    ctx.restore();

    // Update flash intensity
    if (flashIntensity > 0) {
        const currentTime = performance.now();
        const timeDiff = currentTime - lastFlashUpdate;
        flashIntensity = Math.max(0, flashIntensity - (timeDiff / 500)); // Fade over 500ms
        lastFlashUpdate = currentTime;
    }
}

function updatePlayerPosition(deltaTime) {
    if (!game.keys) return;

    let dx = 0;
    let dy = 0;
    const moveSpeed = game.player.speed * game.playerUpgrades.speed;

    // Klavye kontrolleri
    if (game.keys.w || game.keys.arrowup) dy -= 1;
    if (game.keys.s || game.keys.arrowdown) dy += 1;
    if (game.keys.a || game.keys.arrowleft) dx -= 1;
    if (game.keys.d || game.keys.arrowright) dx += 1;

    let isMoving = false;

    // Eğer klavye ile hareket varsa
    if (dx !== 0 || dy !== 0) {
        isMoving = true;
        // Çapraz hareket için normalize
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length !== 0) {
            dx /= length;
            dy /= length;
        }

        game.player.x += dx * moveSpeed * deltaTime * 30;
        game.player.y += dy * moveSpeed * deltaTime * 30;
        
        // Store movement direction
        game.player.moveDirection = {
            dx: dx,
            dy: dy
        };
    }

    // Mouse/touch kontrolleri
    if (game.joystickInput && (game.joystickInput.x !== 0 || game.joystickInput.y !== 0)) {
        isMoving = true;
        game.player.x += game.joystickInput.x * moveSpeed * deltaTime * 60;
        game.player.y += game.joystickInput.y * moveSpeed * deltaTime * 60;
        
        // Store joystick movement direction
        const length = Math.sqrt(game.joystickInput.x * game.joystickInput.x + game.joystickInput.y * game.joystickInput.y);
        game.player.moveDirection = {
            dx: game.joystickInput.x / length,
            dy: game.joystickInput.y / length
        };
    } else if (game.isMoving && !dx && !dy) {
        if (game.targetX !== undefined && game.targetY !== undefined) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = game.targetX - rect.left;
            const mouseY = game.targetY - rect.top;
            const dx2 = mouseX - canvas.width / 2;
            const dy2 = mouseY - canvas.height / 2;
            const length = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (length !== 0) {
                isMoving = true;
                game.player.x += (dx2 / length) * moveSpeed * deltaTime * 30;
                game.player.y += (dy2 / length) * moveSpeed * deltaTime * 30;
                
                // Store mouse movement direction
                game.player.moveDirection = {
                    dx: dx2 / length,
                    dy: dy2 / length
                };
            }
        }
    }
    
    // Only update moveDirection if actually moving
    if (!isMoving) {
        // Keep the last movement direction if we have one, otherwise use default
        if (!game.player.moveDirection) {
            game.player.moveDirection = { dx: 1, dy: 0 };
        }
    }

    // Arena sınır kontrolü - sadece arena ve boss aktifse kontrol et
    if (game.bossArena && game.bossArena.active && game.boss) {
        const distanceToArenaCenter = Math.sqrt(
            Math.pow(game.player.x - game.bossArena.x, 2) +
            Math.pow(game.player.y - game.bossArena.y, 2)
        );

        if (distanceToArenaCenter > game.bossArena.radius - game.player.size / 2) {
            // Eğer daha önce çarpışma olmamışsa efekti göster
            if (!game.player.isCollidingWithArena) {
                createParticle(game.player.x, game.player.y, '#FF0000');
                showFloatingText('⚡', game.player.x, game.player.y, 'critical');
                game.player.isCollidingWithArena = true;
            }

            // Oyuncuyu arena içinde tut
            const angle = Math.atan2(
                game.player.y - game.bossArena.y,
                game.player.x - game.bossArena.x
            );
            game.player.x = game.bossArena.x + Math.cos(angle) * (game.bossArena.radius - game.player.size / 2);
            game.player.y = game.bossArena.y + Math.sin(angle) * (game.bossArena.radius - game.player.size / 2);
        } else {
            // Oyuncu arena sınırından uzaklaştığında flag'i sıfırla
            game.player.isCollidingWithArena = false;
        }
    }
}

function handlePlayerHit(damage = 1) {
    if (game.player.invulnerable || immortalityCheckbox.checked) return;
    game.player.health -= damage;
    document.body.classList.add('hurt');
    flashIntensity = 1; // Set flash to maximum
    lastFlashUpdate = performance.now();
    let pulseTimeout = setTimeout(() => document.body.classList.remove('hurt'), 500);
    if (game.player.health <= 0) {
        playSound('death', 1, 0);
        gameOver();
    } else {
        playSound('hurt', 1, 0);
    }
    game.player.invulnerable = true;
    game.invulnerabilityEndTime = performance.now() + 1000; // 1 second of invulnerability
    const checkMenuInterval = setInterval(() => {
        const isMenuOpen = settingsScreen.style.display === 'block' ||
            upgradeScreen.style.display === 'block' ||
            gameOverScreen.style.display === 'block' ||
            introScreen.style.display === 'block';
        if (isMenuOpen) {
            clearTimeout(pulseTimeout);
        } else {
            clearInterval(checkMenuInterval);
            pulseTimeout = setTimeout(() => document.body.classList.remove('hurt'), 500);
        }
    }, 100);
}

function shoot() {
    if (currentState !== GameState.PLAYING) return;
    const nearestEnemy = findNearestEnemy();
    if (nearestEnemy) {
        const spread = Math.PI * 0.1; // Mermi yayılım açısı
        const baseAngle = Math.atan2(nearestEnemy.y - game.player.y, nearestEnemy.x - game.player.x);
        const projectiles = game.playerUpgrades.projectiles;
        const isWarrior = game.player.characterType === 'warrior';
        const isArcher = game.player.characterType === 'archer';

        // Mobil cihaz kontrolü
        const isMobile = isTouchDevice();
        const mobileRangeMultiplier = isMobile ? 1.5 : 1; // Mobil için %50 daha fazla menzil
        const mobileSpeedMultiplier = isMobile ? 1.3 : 1; // Mobil için %30 daha hızlı mermi

        for (let i = 0; i < projectiles; i++) {
            let shootAngle = baseAngle + (i - (projectiles - 1) / 2) * (Math.PI / 8);

            const dx = Math.cos(shootAngle);
            const dy = Math.sin(shootAngle);

            // Pool'dan bullet al
            const bullet = bulletPool.get();
            bullet.x = game.player.x;
            bullet.y = game.player.y;
            bullet.dx = dx;
            bullet.dy = dy;
            
            if (isArcher) {
                // Archer specific properties
                bullet.size = canvas.width * 0.005; // Reduced from 0.008
                bullet.speed = canvas.width * 0.006 * mobileSpeedMultiplier; // Faster arrows
                bullet.lifetime = 1.2 * game.playerUpgrades.range * mobileRangeMultiplier; // Longer range
                bullet.pierceCount = game.playerUpgrades.pierce + 1; // Extra pierce for arrows
                bullet.isArcher = true;
            } else if (isWarrior) {
                // Warrior specific properties
                bullet.size = canvas.width * 0.01;
                bullet.speed = canvas.width * 0.004 * mobileSpeedMultiplier;
                bullet.lifetime = 0.8 * game.playerUpgrades.range * mobileRangeMultiplier;
                bullet.pierceCount = game.playerUpgrades.pierce;
                bullet.isWarrior = true;
                bullet.rotation = 0;
                bullet.rotationSpeed = 10;
                bullet.lastUpdateTime = Date.now() / 1000;
            } else if (game.player.characterType === 'wizard') {
                // Wizard specific properties
                bullet.size = canvas.width * 0.008;
                bullet.speed = canvas.width * 0.005 * mobileSpeedMultiplier;
                bullet.lifetime = 1.1 * game.playerUpgrades.range * mobileRangeMultiplier;
                bullet.pierceCount = game.playerUpgrades.pierce;
                bullet.isWizard = true;
                bullet.rotation = Math.random() * Math.PI * 2;
                bullet.rotationSpeed = 5;
                bullet.lastUpdateTime = Date.now() / 1000;
            } else {
                // Default properties for other characters
                bullet.size = canvas.width * 0.006;
                bullet.speed = canvas.width * 0.005 * mobileSpeedMultiplier;
                bullet.lifetime = game.playerUpgrades.range * mobileRangeMultiplier;
                bullet.pierceCount = game.playerUpgrades.pierce;
            }
            
            bullet.active = true;
            game.bullets.push(bullet);
        }

        // Character specific sound effects
        if (isArcher) {
            playSound('bulletFire', 0.8, 0.3); // Higher pitch for bow sound
        } else if (isWarrior) {
            playSound('bulletFire', 1.2, -0.2); // Lower pitch for sword sound
        } else {
            playSound('bulletFire', 1, 0.1); // Default sound
        }
    }
}

function resurrectPlayer() {
    // Oyuncuyu diriltme mantığı
    game.player.health = getPlayerMaxHealth();
    document.getElementById('game-over').style.display = 'none';
    currentState = GameState.PLAYING;
    // İsterseniz kısa bir invulnerability süresi ekleyebilirsiniz
    game.player.invulnerable = true;
    game.invulnerabilityEndTime = performance.now() + 2000; // 2 saniye invulnerability

    // Oyunu devam ettir
    safePokiSDKCall('gameplayStart');
}
