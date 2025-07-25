function resizeCanvas() {
    // Sık kullanılan değerleri yerel değişkenlere al
    const innerW = window.innerWidth;
    const innerH = window.innerHeight;
    
    canvas.width = innerW;
    canvas.height = innerH;
    
    uiOverlay.style.width = `${canvas.width}px`;
    
    const minFontSize = 12;
    const maxFontSize = 18;
    const fontSize = Math.max(minFontSize, Math.min(maxFontSize, canvas.width * 0.015));
    uiOverlay.style.fontSize = `${fontSize}px`;
    
    if (isTouchDevice()) {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.style.bottom = '20px';
        }
    }
    
    // Daha uzak zoom değeri
    game.camera.zoom = 0.35;

    handleMobileLayout();
}

function drawFireballs() {
    if (!game?.activeFireballs) return;

    // Kamera transformasyonlarını uygula
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    game.activeFireballs.forEach(fireball => {
        if (!fireball.active) return;

        const progress = fireball.progress;
        const baseRadius = fireball.radius;
        const explosionRadius = fireball.explosionRadius;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (!fireball.hasExploded) {
            if (fireball.isMeteor) {
                // Meteor trail effect
                const trailLength = 30;
                const trailSteps = 10;
                for (let i = 0; i < trailSteps; i++) {
                    const trailProgress = i / trailSteps;
                    const trailX = fireball.x - fireball.dx * trailLength * trailProgress;
                    const trailY = fireball.y - fireball.dy * trailLength * trailProgress;
                    const trailRadius = baseRadius * (1 - trailProgress * 0.8);

                    const gradient = ctx.createRadialGradient(
                        trailX, trailY, 0,
                        trailX, trailY, trailRadius * 2
                    );
                    gradient.addColorStop(0, `rgba(255, 200, 50, ${0.4 * (1 - trailProgress)})`);
                    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.2 * (1 - trailProgress)})`);
                    gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

                    ctx.beginPath();
                    ctx.arc(trailX, trailY, trailRadius * 2, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }

                // Main meteor body
                const meteorGradient = ctx.createRadialGradient(
                    fireball.x, fireball.y, 0,
                    fireball.x, fireball.y, baseRadius * 2
                );
                meteorGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                meteorGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.7)');
                meteorGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

                ctx.beginPath();
                ctx.arc(fireball.x, fireball.y, baseRadius * 2, 0, Math.PI * 2);
                ctx.fillStyle = meteorGradient;
                ctx.fill();
            } else {
                // Original fireball drawing code
                const gradient = ctx.createRadialGradient(
                    fireball.x, fireball.y, 0,
                    fireball.x, fireball.y, baseRadius
                );
                gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.7)');
                gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

                ctx.beginPath();
                ctx.arc(fireball.x, fireball.y, baseRadius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        } else {
            // Explosion effect
            const explosionProgress = progress / 0.5;
            const currentRadius = explosionRadius * (1 - explosionProgress);

            const explodeGradient = ctx.createRadialGradient(
                fireball.x, fireball.y, 0,
                fireball.x, fireball.y, currentRadius
            );
            explodeGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            explodeGradient.addColorStop(0.4, 'rgba(255, 150, 50, 0.6)');
            explodeGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

            ctx.beginPath();
            ctx.arc(fireball.x, fireball.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = explodeGradient;
            ctx.fill();
        }

        ctx.restore();
    });

    ctx.restore();
}

function drawCoreLayers(ctx, time, baseRadius) {
    const coreLayerCount = 3;

    for (let i = 0; i < coreLayerCount; i++) {
        const layerRadius = baseRadius * (1 - i * 0.2);
        const pulseScale = 1 + Math.sin(time * (3 + i) + i * Math.PI / 3) * 0.1;

        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
        coreGradient.addColorStop(0, `rgba(255, ${255 - i * 30}, ${200 - i * 60}, ${1 - i * 0.2})`);
        coreGradient.addColorStop(0.5, `rgba(255, ${180 - i * 30}, 0, ${0.9 - i * 0.2})`);
        coreGradient.addColorStop(1, `rgba(200, ${50 - i * 20}, 0, ${0.8 - i * 0.2})`);

        ctx.beginPath();
        ctx.arc(0, 0, layerRadius * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
    }
}

function drawPlasmaRings(ctx, time, baseRadius) {
    const ringCount = 12;

    for (let i = 0; i < ringCount; i++) {
        const ringAngle = (i / ringCount) * Math.PI * 2;
        const ringPhase = time * 3 + i * Math.PI / 6;
        const waveOffset = Math.sin(ringPhase) * 0.3;
        const ringRadius = baseRadius * (1.2 + waveOffset);

        ctx.save();
        ctx.rotate(ringAngle + time * 2);

        const ringGradient = ctx.createLinearGradient(ringRadius, 0, ringRadius * 2, 0);
        ringGradient.addColorStop(0, `rgba(255, ${150 + Math.sin(ringPhase) * 50}, 0, 0.9)`);
        ringGradient.addColorStop(0.4, `rgba(255, ${100 + Math.sin(ringPhase + 1) * 30}, 0, 0.7)`);
        ringGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = ringGradient;
        ctx.lineWidth = baseRadius * 0.05;
        ctx.stroke();

        ctx.restore();
    }
}

function drawSpiralArms(ctx, time, baseRadius) {
    const spiralCount = 8;

    for (let i = 0; i < spiralCount; i++) {
        const spiralAngle = (i / spiralCount) * Math.PI * 2 + time * 1.5;

        ctx.save();
        ctx.rotate(spiralAngle);

        const spiralGradient = ctx.createLinearGradient(baseRadius * 0.8, 0, baseRadius * 2.2, 0);
        spiralGradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
        spiralGradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.7)');
        spiralGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(baseRadius * 0.8, 0);

        for (let t = 0; t <= 1; t += 0.05) {
            const spiralRadius = baseRadius * (0.8 + t * 1.4);
            const spiralY = Math.sin(t * Math.PI * 4 + time * 5) * (baseRadius * 0.3);
            ctx.lineTo(spiralRadius, spiralY);
        }

        ctx.lineWidth = baseRadius * 0.15;
        ctx.strokeStyle = spiralGradient;
        ctx.stroke();
        ctx.restore();
    }
}

// Bu fonksiyon orijinal kodda tanımlanmış ama içi görünmüyor.
// drawEnergyParticles() fonksiyonunu, silmeden bıraktım.
// Mantık bozulmasın diye, orijinalde tanımlanmış varsaydığımız varsayılan bir stub:
function drawEnergyParticles(ctx, time, baseRadius) {
    // Orijinal koddaki gibi stub olarak bırakıyoruz
    // (Kod içinde bir yerde çağrılıyor ancak içi verilmemişti)
}

function drawGlowEffect(ctx, time, baseRadius) {
    const glowCount = 3;

    for (let i = 0; i < glowCount; i++) {
        const glowRadius = baseRadius * (1.5 + i * 0.5);
        const pulseIntensity = (Math.sin(time * 2 + i * Math.PI / 3) * 0.1 + 0.9);

        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGradient.addColorStop(0, `rgba(255, 150, 0, ${0.2 * pulseIntensity})`);
        glowGradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.1 * pulseIntensity})`);
        glowGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
}

function drawLightnings() {
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const zoom = game.camera.zoom;
    const pX = game.player.x;
    const pY = game.player.y;
    const now = performance.now(); // Tek seferde al

    ctx.save();
    ctx.translate(cWidth / 2, cHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-pX, -pY);

    const time = now / 1000;

    activeLightnings.forEach(lightning => {
        const currentProgress = Math.min(lightning.progress, 1);
        const visibleSegments = Math.floor(lightning.segments.length * currentProgress);

        if (visibleSegments > 0) {
            ctx.globalCompositeOperation = 'lighter';

            // Elektrik alanı efekti
            const fieldRadius = 30;
            for (let i = 0; i < visibleSegments; i++) {
                const segment = lightning.segments[i];
                const intensity = Math.sin(time * 10 + i) * 0.5 + 0.5;

                const fieldGlow = ctx.createRadialGradient(
                    segment.x, segment.y, 0,
                    segment.x, segment.y, fieldRadius * intensity
                );

                fieldGlow.addColorStop(0, 'rgba(180, 230, 255, 0.4)');
                fieldGlow.addColorStop(0.5, 'rgba(100, 200, 255, 0.2)');
                fieldGlow.addColorStop(1, 'rgba(50, 150, 255, 0)');

                ctx.fillStyle = fieldGlow;
                ctx.beginPath();
                ctx.arc(segment.x, segment.y, fieldRadius * intensity, 0, Math.PI * 2);
                ctx.fill();
            }

            // Ana yıldırım efekti - 5 katmanlı
            for (let layer = 0; layer < 5; layer++) {
                ctx.beginPath();
                const startSegment = lightning.segments[0];
                let lastX = startSegment.x;
                let lastY = startSegment.y;
                ctx.moveTo(lastX, lastY);

                for (let i = 1; i < visibleSegments; i++) {
                    const segment = lightning.segments[i];
                    const progress = i / visibleSegments;

                    // Dinamik dalga efekti
                    const waveIntensity = (1 - layer * 0.2) * 3;
                    const waveFreq = 20 + layer * 5;
                    const timeFactor = time * (15 + layer * 2);

                    const dx = segment.x - lastX;
                    const dy = segment.y - lastY;
                    const segmentLength = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);

                    const wave1 = Math.sin(timeFactor + i * 0.5) * waveIntensity;
                    const wave2 = Math.cos(timeFactor * 1.3 + i * 0.4) * waveIntensity;

                    // Kontrol noktaları için offset hesaplama
                    const perpX = Math.cos(angle + Math.PI/2);
                    const perpY = Math.sin(angle + Math.PI/2);

                    const cp1x = lastX + dx * 0.25 + perpX * wave1;
                    const cp1y = lastY + dy * 0.25 + perpY * wave1;
                    const cp2x = lastX + dx * 0.75 + perpX * wave2;
                    const cp2y = lastY + dy * 0.75 + perpY * wave2;

                    // Pürüzsüz eğri çizimi
                    const nextX = segment.x + Math.sin(time * waveFreq + i) * (waveIntensity * 0.5);
                    const nextY = segment.y + Math.cos(time * waveFreq + i) * (waveIntensity * 0.5);

                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextX, nextY);

                    lastX = segment.x;
                    lastY = segment.y;
                }

                // Her katman için farklı stil
                const baseAlpha = 1 - layer * 0.15;
                const width = 14 - layer * 2.5;

                if (layer === 0) {
                    ctx.strokeStyle = `rgba(10, 50, 140, ${baseAlpha * 0.9})`;
                    ctx.lineWidth = width;
                } else if (layer === 1) {
                    ctx.strokeStyle = `rgba(30, 100, 255, ${baseAlpha * 0.8})`;
                    ctx.lineWidth = width * 0.8;
                } else if (layer === 2) {
                    ctx.strokeStyle = `rgba(100, 180, 255, ${baseAlpha * 0.9})`;
                    ctx.lineWidth = width * 0.6;
                } else if (layer === 3) {
                    ctx.strokeStyle = `rgba(160, 220, 255, ${baseAlpha})`;
                    ctx.lineWidth = width * 0.4;
                } else {
                    ctx.strokeStyle = `rgba(220, 240, 255, ${baseAlpha})`;
                    ctx.lineWidth = width * 0.2;
                }

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }

            // Enerji parçacıkları
            for (let i = 0; i < visibleSegments; i++) {
                const segment = lightning.segments[i];
                const particleCount = Math.floor(Math.random() * 3) + 2;

                for (let p = 0; p < particleCount; p++) {
                    const particleAngle = Math.random() * Math.PI * 2;
                    const particleDistance = Math.random() * 15;
                    const fadeEffect = Math.sin(time * 8 + i + p) * 0.5 + 0.5;

                    const px = segment.x + Math.cos(particleAngle) * particleDistance;
                    const py = segment.y + Math.sin(particleAngle) * particleDistance;

                    const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 6 * fadeEffect);
                    particleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    particleGradient.addColorStop(0.4, 'rgba(130, 200, 255, 0.6)');
                    particleGradient.addColorStop(1, 'rgba(80, 150, 255, 0)');

                    ctx.fillStyle = particleGradient;
                    ctx.beginPath();
                    ctx.arc(px, py, 6 * fadeEffect, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Yan dallanmalar
            ctx.globalCompositeOperation = 'source-over';
            for (let i = 1; i < visibleSegments - 1; i++) {
                if (Math.random() < 0.3) {
                    const start = lightning.segments[i];
                    const end = lightning.segments[i + 1];
                    const branchLength = Math.random() * 30 + 20;
                    const baseAngle = Math.atan2(end.y - start.y, end.x - start.x);
                    const branchAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8;

                    const branchEnd = {
                        x: start.x + Math.cos(branchAngle) * branchLength,
                        y: start.y + Math.sin(branchAngle) * branchLength
                    };

                    const controlPoint = {
                        x: start.x + Math.cos(branchAngle) * (branchLength * 0.5) +
                            (Math.random() - 0.5) * 20,
                        y: start.y + Math.sin(branchAngle) * (branchLength * 0.5) +
                            (Math.random() - 0.5) * 20
                    };

                    // Her dallanma için 3 katman
                    for (let layer = 0; layer < 3; layer++) {
                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.quadraticCurveTo(
                            controlPoint.x,
                            controlPoint.y,
                            branchEnd.x,
                            branchEnd.y
                        );

                        const alpha = (1 - layer * 0.3) * 0.7;
                        if (layer === 0) {
                            ctx.strokeStyle = `rgba(30, 100, 255, ${alpha})`;
                            ctx.lineWidth = 4;
                        } else if (layer === 1) {
                            ctx.strokeStyle = `rgba(100, 180, 255, ${alpha})`;
                            ctx.lineWidth = 2;
                        } else {
                            ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
                            ctx.lineWidth = 1;
                        }

                        ctx.stroke();
                    }

                    // Dallanma ucu parlaması
                    const tipGlow = ctx.createRadialGradient(
                        branchEnd.x, branchEnd.y, 0,
                        branchEnd.x, branchEnd.y, 10
                    );
                    tipGlow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                    tipGlow.addColorStop(0.5, 'rgba(100, 180, 255, 0.2)');
                    tipGlow.addColorStop(1, 'rgba(50, 150, 255, 0)');

                    ctx.fillStyle = tipGlow;
                    ctx.beginPath();
                    ctx.arc(branchEnd.x, branchEnd.y, 10, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    });

    ctx.restore();
}

function drawGround() {
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const zoom = game.camera.zoom;
    const pX = game.player.x;
    const pY = game.player.y + 100; // Added offset to move camera up

    const p = ctx.createPattern(loadedAssets.images.groundPattern, 'repeat');
    ctx.save();
    ctx.translate(cWidth / 2, cHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-pX, -pY);
    ctx.fillStyle = p;

    const s = 0.5;
    ctx.scale(s, s);
    ctx.fillRect(
        (pX - cWidth / (2 * zoom)) / s,
        (pY - cHeight / (2 * zoom)) / s,
        (cWidth / zoom) / s,
        (cHeight / zoom) / s
    );
    ctx.restore();
}

function drawEnemies() {
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const zoom = game.camera.zoom;
    const pX = game.player.x;
    const pY = game.player.y;
    const now = performance.now(); // Tek seferde al

    ctx.save();
    ctx.translate(cWidth / 2, cHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-pX, -pY);

    const enemiesArr = game.enemies;
    const enemiesLen = enemiesArr.length;

    for (let index = 0; index < enemiesLen; index++) {
        const e = enemiesArr[index];

        // Flash efekti için interpolasyon değerini hesapla
        let flashIntensity = 0;
        if (e.isFlashing) {
            const timeSinceFlash = now - e.flashStartTime;
            if (timeSinceFlash < e.flashDuration) {
                flashIntensity = Math.sin((1 - timeSinceFlash / e.flashDuration) * Math.PI);
            } else {
                e.isFlashing = false;
            }
        }

        const sway = Math.sin((now + e.x) / 100) * 0.8;
        const actualX = e.x + sway; // Salınımı pozisyona ekle

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        switch(e.type) {
            case 'splitter': {
                const mainColor = rgbToString(interpolateColor([139, 0, 0], [255, 255, 255], flashIntensity));
                const secondaryColor = rgbToString(interpolateColor([74, 0, 0], [255, 255, 255], flashIntensity));
                const detailColor = rgbToString(interpolateColor([255, 69, 0], [255, 255, 255], flashIntensity));
                const eyeColor = rgbToString(interpolateColor([255, 215, 0], [255, 255, 255], flashIntensity));
                const pupilColor = rgbToString(interpolateColor([255, 0, 0], [255, 255, 255], flashIntensity));

                // Ana gövde
                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size / 2, e.y - e.size / 2, e.size, e.size);
                ctx.stroke();
                ctx.fill();

                // İkincil detaylar
                ctx.fillStyle = secondaryColor;
                ctx.beginPath();
                ctx.moveTo(e.x - e.size / 2, e.y - e.size / 2);
                ctx.lineTo(e.x, e.y + e.size / 2);
                ctx.lineTo(e.x + e.size / 2, e.y - e.size / 2);
                ctx.fill();

                // Detay çizgileri
                ctx.strokeStyle = detailColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(e.x - e.size / 2, e.y);
                ctx.lineTo(e.x + e.size / 2, e.y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(e.x, e.y - e.size / 2);
                ctx.lineTo(e.x, e.y + e.size / 2);
                ctx.stroke();

                // Köşe detayları
                ctx.fillStyle = detailColor;
                const cornerSize = e.size / 6;
                ctx.beginPath();
                ctx.arc(e.x - e.size/2, e.y - e.size/2, cornerSize, 0, Math.PI * 2);
                ctx.arc(e.x + e.size/2, e.y - e.size/2, cornerSize, 0, Math.PI * 2);
                ctx.arc(e.x - e.size/2, e.y + e.size/2, cornerSize, 0, Math.PI * 2);
                ctx.arc(e.x + e.size/2, e.y + e.size/2, cornerSize, 0, Math.PI * 2);
                ctx.fill();

                // Gözler
                ctx.fillStyle = eyeColor;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(e.x - e.size/4, e.y - e.size/4, e.size/5, 0, Math.PI * 2);
                ctx.arc(e.x + e.size/4, e.y - e.size/4, e.size/5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();

                // Göz bebekleri
                ctx.fillStyle = pupilColor;
                ctx.beginPath();
                ctx.arc(actualX - e.size/4, e.y - e.size/4, e.size/10, 0, Math.PI * 2);
                ctx.arc(actualX + e.size/4, e.y - e.size/4, e.size/10, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'blinker': {
                const blinkerMainColor = rgbToString(interpolateColor([75, 0, 130], [255, 255, 255], flashIntensity));
                const blinkerSecondaryColor = rgbToString(interpolateColor([42, 0, 76], [255, 255, 255], flashIntensity));
                const blinkerRingColor = rgbToString(interpolateColor([148, 0, 211], [255, 255, 255], flashIntensity));
                const blinkerEyeColor = rgbToString(interpolateColor([230, 230, 250], [255, 255, 255], flashIntensity));
                const blinkerPupilColor = rgbToString(interpolateColor([148, 0, 211], [255, 255, 255], flashIntensity));
                const blinkerGlowColor = rgbToString(interpolateColor([230, 230, 250], [255, 255, 255], flashIntensity));
                const blinkerDetailColor = rgbToString(interpolateColor([128, 0, 128], [255, 255, 255], flashIntensity));

                // Ana gövde
                ctx.fillStyle = blinkerMainColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size / 2, e.y - e.size / 2, e.size, e.size);
                ctx.stroke();
                ctx.fill();

                // Üçgen detay
                ctx.fillStyle = blinkerSecondaryColor;
                ctx.beginPath();
                ctx.moveTo(e.x - e.size / 2, e.y - e.size / 2);
                ctx.lineTo(e.x, e.y + e.size / 2);
                ctx.lineTo(e.x + e.size / 2, e.y - e.size / 2);
                ctx.fill();

                // Köşe detayları
                ctx.fillStyle = blinkerDetailColor;
                const blinkerCornerSize = e.size / 6;
                ctx.beginPath();
                ctx.arc(e.x - e.size/2, e.y - e.size/2, blinkerCornerSize, 0, Math.PI * 2);
                ctx.arc(e.x + e.size/2, e.y - e.size/2, blinkerCornerSize, 0, Math.PI * 2);
                ctx.arc(e.x - e.size/2, e.y + e.size/2, blinkerCornerSize, 0, Math.PI * 2);
                ctx.arc(e.x + e.size/2, e.y + e.size/2, blinkerCornerSize, 0, Math.PI * 2);
                ctx.fill();

                // Büyülü halkalar
                ctx.save();
                const t = now / 500;
                ctx.strokeStyle = blinkerRingColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(actualX, e.y, e.size * 0.7, 0, Math.PI * 2);
                ctx.globalAlpha = 0.3 + Math.sin(t) * 0.2;
                ctx.stroke();

                // Göz
                ctx.fillStyle = blinkerEyeColor;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(actualX, e.y - e.size/4, e.size/4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();

                // Göz bebeği
                ctx.fillStyle = blinkerPupilColor;
                ctx.beginPath();
                ctx.arc(actualX, e.y - e.size/4, e.size/8, 0, Math.PI * 2);
                ctx.fill();

                // Büyü ışınları
                ctx.lineWidth = 2;
                for(let i = 0; i < 4; i++) {
                    const angle = t + i * Math.PI/2;
                    const innerRadius = e.size * 0.4;
                    const outerRadius = e.size * 0.8;

                    ctx.beginPath();
                    ctx.moveTo(
                        e.x + Math.cos(angle) * innerRadius,
                        e.y + Math.sin(angle) * innerRadius
                    );

                    const midAngle = angle + Math.sin(t * 2) * 0.2;
                    const midRadius = (innerRadius + outerRadius) / 2;
                    ctx.lineTo(
                        e.x + Math.cos(midAngle) * midRadius,
                        e.y + Math.sin(midAngle) * midRadius
                    );

                    ctx.lineTo(
                        e.x + Math.cos(angle) * outerRadius,
                        e.y + Math.sin(angle) * outerRadius
                    );

                    ctx.strokeStyle = blinkerGlowColor;
                    ctx.globalAlpha = 0.8;
                    ctx.stroke();
                }
                ctx.restore();
                break;
            }
            case 'speeder': {
                const batMainColor = rgbToString(interpolateColor([40, 40, 40], [255, 255, 255], flashIntensity));
                const batWingColor = rgbToString(interpolateColor([20, 20, 20], [255, 255, 255], flashIntensity));
                const batEyeColor = rgbToString(interpolateColor([255, 255, 0], [255, 255, 255], flashIntensity));
                
                // Kanat çırpma animasyonu için zamanlama
                const wingFlap = Math.sin(now / 100) * 0.5;
                
                // Ana gövde (yarasa bedeni)
                ctx.fillStyle = batMainColor;
                ctx.beginPath();
                ctx.ellipse(actualX, e.y, e.size/3, e.size/2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            
                // Kanatlar
                ctx.fillStyle = batWingColor;
                
                // Sol kanat
                ctx.save();
                ctx.translate(actualX, e.y);
                ctx.rotate(-Math.PI/4 + wingFlap);
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Kanat kemiği
                ctx.lineTo(-e.size * 0.7, -e.size * 0.3);
                // Kanat zarı
                ctx.quadraticCurveTo(
                    -e.size * 0.5, -e.size * 0.5,
                    -e.size * 0.2, 0
                );
                ctx.quadraticCurveTo(
                    -e.size * 0.5, e.size * 0.2,
                    -e.size * 0.7, -e.size * 0.3
                );
                ctx.fill();
                ctx.stroke();
                
                // Kanat detayları (kemik çizgileri)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-e.size * 0.5, -e.size * 0.2);
                ctx.moveTo(0, 0);
                ctx.lineTo(-e.size * 0.4, 0);
                ctx.stroke();
                
                ctx.restore();
            
                // Sağ kanat
                ctx.save();
                ctx.translate(actualX, e.y);
                ctx.rotate(Math.PI/4 - wingFlap);
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Kanat kemiği
                ctx.lineTo(e.size * 0.7, -e.size * 0.3);
                // Kanat zarı
                ctx.quadraticCurveTo(
                    e.size * 0.5, -e.size * 0.5,
                    e.size * 0.2, 0
                );
                ctx.quadraticCurveTo(
                    e.size * 0.5, e.size * 0.2,
                    e.size * 0.7, -e.size * 0.3
                );
                ctx.fill();
                ctx.stroke();
                
                // Kanat detayları (kemik çizgileri)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(e.size * 0.5, -e.size * 0.2);
                ctx.moveTo(0, 0);
                ctx.lineTo(e.size * 0.4, 0);
                ctx.stroke();
                
                ctx.restore();
            
                // Gözler
                ctx.fillStyle = batEyeColor;
                ctx.beginPath();
                ctx.arc(actualX - e.size/6, e.y - e.size/8, e.size/12, 0, Math.PI * 2);
                ctx.arc(actualX + e.size/6, e.y - e.size/8, e.size/12, 0, Math.PI * 2);
                ctx.fill();
                
                // Göz parlaması
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(actualX - e.size/6 - e.size/24, e.y - e.size/8 - e.size/24, e.size/36, 0, Math.PI * 2);
                ctx.arc(actualX + e.size/6 - e.size/24, e.y - e.size/8 - e.size/24, e.size/36, 0, Math.PI * 2);
                ctx.fill();
            
                // Kulaklar
                ctx.fillStyle = batMainColor;
                ctx.beginPath();
                // Sol kulak
                ctx.moveTo(actualX - e.size/6, e.y - e.size/4);
                ctx.lineTo(actualX - e.size/3, e.y - e.size/2);
                ctx.lineTo(actualX, e.y - e.size/4);
                // Sağ kulak
                ctx.moveTo(actualX + e.size/6, e.y - e.size/4);
                ctx.lineTo(actualX + e.size/3, e.y - e.size/2);
                ctx.lineTo(actualX, e.y - e.size/4);
                ctx.fill();
                ctx.stroke();
            
                // Burun ve ağız
                ctx.beginPath();
                ctx.arc(actualX, e.y, e.size/20, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(actualX - e.size/10, e.y + e.size/10);
                ctx.quadraticCurveTo(actualX, e.y + e.size/6, actualX + e.size/10, e.y + e.size/10);
                ctx.stroke();
                break;
            }
            case 'tank': {
                const frankColor = rgbToString(interpolateColor([70, 120, 70], [255, 255, 255], flashIntensity));
                const skinColor = rgbToString(interpolateColor([150, 200, 150], [255, 255, 255], flashIntensity));
                const metalColor = rgbToString(interpolateColor([80, 80, 80], [255, 255, 255], flashIntensity));
                const boltColor = rgbToString(interpolateColor([120, 120, 120], [255, 255, 255], flashIntensity));
            
                // Ana gövde (ceket) - boyutu küçültüldü
                ctx.fillStyle = frankColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size/3, e.y - e.size/3, e.size*2/3, e.size*2/3);
                ctx.fill();
                ctx.stroke();
            
                // Geniş omuzlar - boyutu küçültüldü
                ctx.fillStyle = frankColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size*0.5, e.y - e.size/3, e.size, e.size/4);
                ctx.fill();
                ctx.stroke();
            
                // Baş - boyutu küçültüldü
                ctx.fillStyle = skinColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size/4, e.y - e.size/3 - e.size/4, e.size/2, e.size/3);
                ctx.fill();
                ctx.stroke();
            
                // Dikişler
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1.5;
                
                // Yüzdeki dikişler
                ctx.beginPath();
                for(let i = -2; i <= 2; i++) {
                    const x = actualX + i * (e.size/12);
                    const y = e.y - e.size/3 - e.size/8;
                    ctx.moveTo(x - e.size/50, y);
                    ctx.lineTo(x + e.size/50, y);
                }
                ctx.stroke();
            
                // Vidalar/cıvatalar - boyutu küçültüldü
                ctx.fillStyle = boltColor;
                const boltPositions = [
                    {x: -0.3, y: -0.5}, // Sol üst
                    {x: 0.3, y: -0.5},  // Sağ üst
                    {x: -0.45, y: -0.25}, // Sol omuz
                    {x: 0.45, y: -0.25},  // Sağ omuz
                ];
            
                boltPositions.forEach(pos => {
                    ctx.beginPath();
                    ctx.arc(actualX + pos.x * e.size, e.y + pos.y * e.size, e.size/12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    
                    // Vida çizgisi
                    ctx.beginPath();
                    ctx.moveTo(actualX + pos.x * e.size - e.size/20, e.y + pos.y * e.size);
                    ctx.lineTo(actualX + pos.x * e.size + e.size/20, e.y + pos.y * e.size);
                    ctx.stroke();
                });
            
                // Gözler - boyutu küçültüldü
                const eyeColor = rgbToString(interpolateColor([255, 255, 0], [255, 255, 255], flashIntensity));
                ctx.fillStyle = eyeColor;
                const eyeY = e.y - e.size/3 - e.size/8;
                
                // Sol göz (daha küçük)
                ctx.beginPath();
                ctx.arc(actualX - e.size/8, eyeY, e.size/16, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Sağ göz (daha büyük)
                ctx.beginPath();
                ctx.arc(actualX + e.size/8, eyeY, e.size/12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            
                // Kaşlar
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Sol kaş
                ctx.moveTo(actualX - e.size/6, eyeY - e.size/10);
                ctx.lineTo(actualX - e.size/16, eyeY - e.size/12);
                // Sağ kaş
                ctx.moveTo(actualX + e.size/16, eyeY - e.size/12);
                ctx.lineTo(actualX + e.size/6, eyeY - e.size/10);
                ctx.stroke();
            
                // Ağız (düz çizgi)
                ctx.beginPath();
                ctx.moveTo(actualX - e.size/6, e.y - e.size/3);
                ctx.lineTo(actualX + e.size/6, e.y - e.size/3);
                ctx.stroke();
            
                // Metal plakalar - boyutu küçültüldü
                ctx.fillStyle = metalColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size*0.5, e.y - e.size/8, e.size*0.2, e.size/4);
                ctx.rect(actualX + e.size*0.3, e.y - e.size/8, e.size*0.2, e.size/4);
                ctx.fill();
                ctx.stroke();
            
                break;
            }
            case 'summoner': {
                const wizardRobeColor = rgbToString(interpolateColor([75, 0, 130], [255, 255, 255], flashIntensity));
                const hatColor = rgbToString(interpolateColor([50, 0, 80], [255, 255, 255], flashIntensity));
                const starColor = rgbToString(interpolateColor([255, 215, 0], [255, 255, 255], flashIntensity));
                const magicColor = rgbToString(interpolateColor([147, 112, 219], [255, 255, 255], flashIntensity));
                
                // Büyücü cübbesi
                ctx.fillStyle = wizardRobeColor;
                ctx.beginPath();
                ctx.moveTo(actualX, e.y - e.size/2);
                ctx.lineTo(actualX - e.size/2, e.y + e.size/2);
                ctx.lineTo(actualX + e.size/2, e.y + e.size/2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
             
                // Cübbe detayları
                ctx.strokeStyle = magicColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(actualX - e.size/3, e.y);
                ctx.lineTo(actualX + e.size/3, e.y);
                ctx.stroke();
             
                // Büyücü şapkası
                ctx.fillStyle = hatColor;
                ctx.beginPath();
                ctx.moveTo(actualX - e.size/3, e.y - e.size/3);
                ctx.lineTo(actualX, e.y - e.size*0.8);
                ctx.lineTo(actualX + e.size/3, e.y - e.size/3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
             
                // Şapka bandı
                ctx.fillStyle = magicColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size/3, e.y - e.size/3, e.size*2/3, e.size/8);
                ctx.fill();
                ctx.stroke();
             
                // Yüz
                const eyeY = e.y - e.size/4;
                
                // Gözler (parlayan)
                const eyeGlow = ctx.createRadialGradient(
                    actualX - e.size/6, eyeY, 0,
                    actualX - e.size/6, eyeY, e.size/10
                );
                eyeGlow.addColorStop(0, starColor);
                eyeGlow.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
                
                ctx.fillStyle = eyeGlow;
                ctx.beginPath();
                ctx.arc(actualX - e.size/6, eyeY, e.size/10, 0, Math.PI * 2);
                ctx.arc(actualX + e.size/6, eyeY, e.size/10, 0, Math.PI * 2);
                ctx.fill();
             
                // Sakal
                ctx.strokeStyle = '#CCCCCC';
                ctx.beginPath();
                for(let i = -3; i <= 3; i++) {
                    const startX = actualX + i * (e.size/10);
                    ctx.moveTo(startX, e.y - e.size/6);
                    ctx.quadraticCurveTo(
                        startX + (i * e.size/20), 
                        e.y + e.size/4,
                        startX + (i * e.size/15), 
                        e.y + e.size/3
                    );
                }
                ctx.stroke();
             
                // Büyü yıldızları
                const starCount = 3;
                const starTime = now / 500;
                
                for(let i = 0; i < starCount; i++) {
                    const angle = (starTime + i * (Math.PI * 2 / starCount));
                    const distance = e.size * 0.4;
                    const starX = actualX + Math.cos(angle) * distance;
                    const starY = e.y + Math.sin(angle) * distance;
                    
                    ctx.fillStyle = starColor;
                    ctx.beginPath();
                    for(let j = 0; j < 5; j++) {
                        const starAngle = j * Math.PI * 2 / 5 - Math.PI / 2;
                        const x = starX + Math.cos(starAngle) * (e.size/12);
                        const y = starY + Math.sin(starAngle) * (e.size/12);
                        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
             
                // Asa
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(actualX + e.size*0.4, e.y - e.size*0.2);
                ctx.lineTo(actualX + e.size*0.6, e.y + e.size*0.3);
                ctx.stroke();
             
                // Asa ucu
                ctx.fillStyle = starColor;
                ctx.beginPath();
                ctx.arc(actualX + e.size*0.4, e.y - e.size*0.2, e.size/12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
             
                break;
             }
            case 'shielder': {
                const shielderMainColor = rgbToString(interpolateColor([0, 100, 0], [255, 255, 255], flashIntensity));
                const shielderSecondaryColor = rgbToString(interpolateColor([0, 75, 0], [255, 255, 255], flashIntensity));
                const shielderEyeColor = rgbToString(interpolateColor([255, 215, 0], [255, 255, 255], flashIntensity));
                const shielderPupilColor = rgbToString(interpolateColor([50, 205, 50], [255, 255, 255], flashIntensity));
                const shielderArmorColor = rgbToString(interpolateColor([0, 128, 0], [255, 255, 255], flashIntensity));
                const shielderDetailColor = rgbToString(interpolateColor([34, 139, 34], [255, 255, 255], flashIntensity));

                // Ana kare gövde
                ctx.fillStyle = shielderMainColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size / 2, e.y - e.size / 2, e.size, e.size);
                ctx.stroke();
                ctx.fill();

                // Kalkan deseni (önde)
                ctx.fillStyle = shielderSecondaryColor;
                ctx.beginPath();
                ctx.moveTo(e.x - e.size/2, e.y - e.size/2);
                ctx.lineTo(e.x + e.size/2, e.y - e.size/2);
                ctx.lineTo(e.x + e.size/3, e.y + e.size/2);
                ctx.lineTo(e.x - e.size/3, e.y + e.size/2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Zırh plakaları
                ctx.fillStyle = shielderArmorColor;
                ctx.beginPath();
                ctx.rect(e.x - e.size/2 - e.size/4, e.y - e.size/3, e.size/4, e.size/1.5);
                ctx.rect(e.x + e.size/2, e.y - e.size/3, e.size/4, e.size/1.5);
                ctx.fill();
                ctx.stroke();

                // Metal şeritler
                ctx.strokeStyle = shielderDetailColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(e.x - e.size/3, e.y - e.size/3);
                ctx.lineTo(e.x + e.size/3, e.y - e.size/3);
                ctx.moveTo(e.x - e.size/4, e.y);
                ctx.lineTo(e.x + e.size/4, e.y);
                ctx.stroke();

                // Köşe perçinleri
                ctx.fillStyle = shielderDetailColor;
                const shielderRivetSize = e.size / 10;
                [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([xMod, yMod]) => {
                    ctx.beginPath();
                    ctx.arc(
                        e.x + (xMod * e.size/3),
                        e.y + (yMod * e.size/3),
                        shielderRivetSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    ctx.stroke();
                });

                // İki göz
                ctx.fillStyle = shielderEyeColor;
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(actualX - e.size/4, e.y - e.size/6, e.size/8, 0, Math.PI * 2);
                ctx.arc(actualX + e.size/4, e.y - e.size/6, e.size/8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fill();

                // Dikdörtgen göz bebekleri
                ctx.fillStyle = shielderPupilColor;
                ctx.fillRect(actualX - e.size/4 - e.size/16, e.y - e.size/6 - e.size/16, e.size/8, e.size/12);
                ctx.fillRect(actualX + e.size/4 - e.size/16, e.y - e.size/6 - e.size/16, e.size/8, e.size/12);
                break;
            }
            default: {
                const vampireMainColor = rgbToString(interpolateColor([60, 0, 60], [255, 255, 255], flashIntensity));  // Mora daha yakın
const vampireCapeColor = rgbToString(interpolateColor([140, 0, 0], [255, 255, 255], flashIntensity));  // Daha koyu kırmızı
const vampireEyeColor = rgbToString(interpolateColor([255, 30, 30], [255, 255, 255], flashIntensity));  // Daha parlak kırmızı
const vampireSkinColor = rgbToString(interpolateColor([235, 235, 245], [255, 255, 255], flashIntensity));  // Biraz daha açık ten
                
                // Pelerin (arka kısım)
                ctx.fillStyle = vampireCapeColor;
                ctx.beginPath();
                ctx.moveTo(actualX, e.y - e.size/2);
                ctx.quadraticCurveTo(
                    actualX - e.size * 0.8, e.y,
                    actualX - e.size * 0.6, e.y + e.size/2
                );
                ctx.lineTo(actualX + e.size * 0.6, e.y + e.size/2);
                ctx.quadraticCurveTo(
                    actualX + e.size * 0.8, e.y,
                    actualX, e.y - e.size/2
                );
                ctx.fill();
                ctx.stroke();
            
                // Ana gövde
                ctx.fillStyle = vampireMainColor;
                ctx.beginPath();
                ctx.rect(actualX - e.size/3, e.y - e.size/2, e.size * 2/3, e.size);
                ctx.fill();
                ctx.stroke();
            
                // Yüz
                ctx.fillStyle = vampireSkinColor;
                ctx.beginPath();
                ctx.arc(actualX, e.y - e.size/4, e.size/3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            
                // Gözler
                ctx.fillStyle = vampireEyeColor;
                const eyeGlow = ctx.createRadialGradient(
                    actualX - e.size/6, e.y - e.size/4, 0,
                    actualX - e.size/6, e.y - e.size/4, e.size/10
                );
                eyeGlow.addColorStop(0, 'rgba(255, 0, 0, 1)');
                eyeGlow.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
                
                ctx.fillStyle = eyeGlow;
                ctx.beginPath();
                ctx.arc(actualX - e.size/6, e.y - e.size/4, e.size/10, 0, Math.PI * 2);
                ctx.arc(actualX + e.size/6, e.y - e.size/4, e.size/10, 0, Math.PI * 2);
                ctx.fill();
            
                // Vampir dişleri
                ctx.fillStyle = 'white';
                ctx.beginPath();
                // Sol diş
                ctx.moveTo(actualX - e.size/8, e.y);
                ctx.lineTo(actualX - e.size/16, e.y + e.size/8);
                ctx.lineTo(actualX, e.y);
                // Sağ diş
                ctx.moveTo(actualX + e.size/8, e.y);
                ctx.lineTo(actualX + e.size/16, e.y + e.size/8);
                ctx.lineTo(actualX, e.y);
                ctx.fill();
                ctx.stroke();
            
                // Pelerin yaka detayları
                ctx.fillStyle = vampireCapeColor;
                ctx.beginPath();
                // Sol yaka
                ctx.moveTo(actualX - e.size/3, e.y - e.size/3);
                ctx.lineTo(actualX - e.size/2, e.y);
                ctx.lineTo(actualX - e.size/4, e.y);
                ctx.closePath();
                // Sağ yaka
                ctx.moveTo(actualX + e.size/3, e.y - e.size/3);
                ctx.lineTo(actualX + e.size/2, e.y);
                ctx.lineTo(actualX + e.size/4, e.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            
                // Animasyonlu kan damlası efekti
                const bloodDripTime = (now % 2000) / 2000;
                if (bloodDripTime < 0.7) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.beginPath();
                    ctx.arc(
                        actualX, 
                        e.y + e.size/8 + bloodDripTime * e.size/2,
                        e.size/16,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
            
                // Yarasa kanatları
                const wingAngle = Math.sin(now / 300) * 0.3; // Kanat çırpma animasyonu
                ctx.fillStyle = vampireCapeColor;
                
                // Sol kanat
                ctx.save();
                ctx.translate(actualX - e.size/3, e.y - e.size/4);
                ctx.rotate(-Math.PI/4 + wingAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-e.size/2, -e.size/4);
                ctx.lineTo(-e.size/2, e.size/4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            
                // Sağ kanat
                ctx.save();
                ctx.translate(actualX + e.size/3, e.y - e.size/4);
                ctx.rotate(Math.PI/4 - wingAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(e.size/2, -e.size/4);
                ctx.lineTo(e.size/2, e.size/4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                break;
            }
        }

        // Health bar için outline ve gölge
        if (e.maxHealth > 0) {  // Sadece maxHealth kontrolü yeterli
            const barWidth = e.size * 1.5;
            const barHeight = 4;
            const barY = e.y - e.size/2 - 10;

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // Bar outline
            ctx.strokeRect(e.x - barWidth/2, barY, barWidth, barHeight);

            // Bar background (kırmızı)
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(e.x - barWidth/2, barY, barWidth, barHeight);

            // Bar fill (yeşil)
            const healthPercent = Math.max(0, e.health) / e.maxHealth;
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(e.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        }

        // drawEnemies fonksiyonunda shielder çizimi için:
        if (e.type === 'shielder' && e.shield) {
            // Kalkan efektini daha az sıklıkla güncelle
            const shieldTime = Math.floor(now / 50);  // Her 50ms'de bir güncelle
            const waveCount = 2; // Dalga sayısını azalt

            ctx.save();
            const shieldGradient = ctx.createRadialGradient(
                e.x, e.y, e.size * 0.4,
                e.x, e.y, e.size * 0.8
            );
            shieldGradient.addColorStop(0, 'rgba(0, 255, 128, 0.1)');
            shieldGradient.addColorStop(1, 'rgba(0, 255, 128, 0.3)');

            for (let i = 0; i < waveCount; i++) {
                const waveRadius = e.size * (0.8 + Math.sin(shieldTime + i) * 0.05);
                ctx.beginPath();
                ctx.arc(e.x, e.y, waveRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 255, 128, ${0.3 - i * 0.1})`;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    ctx.restore();
}

function drawBullets() {
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const zoom = game.camera.zoom;
    const pX = game.player.x;
    const pY = game.player.y;
    const time = Date.now() / 1000;

    ctx.save();
    ctx.translate(cWidth / 2, cHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-pX, -pY);

    const bulletsArr = game.bullets;
    const isWarrior = game.player.characterType === 'warrior';
    const isArcher = game.player.characterType === 'archer';

    for (let i = 0, len = bulletsArr.length; i < len; i++) {
        const b = bulletsArr[i];
        
        if (isArcher) {
            // Arrow projectile drawing
            ctx.save();
            ctx.translate(b.x, b.y);
            
            // Calculate arrow rotation based on movement direction
            const angle = Math.atan2(b.dy, b.dx);
            ctx.rotate(angle);
            
            // Arrow shaft - Reduced size by 40%
            const arrowLength = Math.max(9 + b.size + game.playerUpgrades.size * 0.2, 1);
            const arrowWidth = arrowLength * 0.08; // Reduced width ratio
            
            // Shadow effect - Reduced shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            // Draw arrow shaft
            ctx.strokeStyle = '#8B4513';  // Dark brown
            ctx.lineWidth = arrowWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-arrowLength/2, 0);
            ctx.lineTo(arrowLength/2, 0);
            ctx.stroke();
            
            // Arrow head - Reduced size
            ctx.fillStyle = '#C0C0C0';  // Silver color
            ctx.beginPath();
            ctx.moveTo(arrowLength/2, 0);
            ctx.lineTo(arrowLength/2 - 3, -2);
            ctx.lineTo(arrowLength/2 + 2, 0);
            ctx.lineTo(arrowLength/2 - 3, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Arrow fletching (feathers) - Reduced size
            ctx.fillStyle = '#FFFFFF';  // White color
            const fletchingSize = arrowWidth * 3; // Reduced multiplier
            
            // Left feather
            ctx.beginPath();
            ctx.moveTo(-arrowLength/2 + 3, 0);
            ctx.lineTo(-arrowLength/2 + 1, -fletchingSize);
            ctx.lineTo(-arrowLength/2 + 5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Right feather
            ctx.beginPath();
            ctx.moveTo(-arrowLength/2 + 3, 0);
            ctx.lineTo(-arrowLength/2 + 1, fletchingSize);
            ctx.lineTo(-arrowLength/2 + 5, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        } else if (isWarrior) {
            ctx.save();
            ctx.translate(b.x, b.y);
            
            if (b.isWarrior) {
                const deltaTime = time - b.lastUpdateTime;
                b.rotation += b.rotationSpeed * deltaTime;
                b.lastUpdateTime = time;
                ctx.rotate(b.rotation);
                
                const swordLength = Math.max(12 + b.size + game.playerUpgrades.size * 0.3, 1);
                const swordWidth = swordLength * 0.12;

                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                // Kılıç kabzası
                ctx.fillStyle = '#C0C0C0';
                ctx.fillRect(-3, -12, 6, 24);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(-3, -12, 6, 24);

                // Kılıç siperi
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(-12, -2, 24, 4);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(-12, -2, 24, 4);

                // Kılıç gövdesi (Andúril)
                ctx.strokeStyle = '#C0C0C0';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(swordLength/2 + 15, -4);
                ctx.lineTo(swordLength/2 + 25, 0);
                ctx.lineTo(swordLength/2 + 15, 4);
                ctx.lineTo(0, 4);
                ctx.closePath();
                ctx.fillStyle = '#E8E8E8';
                ctx.fill();
                ctx.stroke();

                // Kılıç üzerindeki elfce yazılar efekti
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(10 + i * 15, -2);
                    ctx.lineTo(20 + i * 15, 2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        } else {
            // Wizard projectile
            if (game.player.characterType === 'wizard') {
                ctx.save();
                ctx.translate(b.x, b.y);
                
                // Magical orb core
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, b.size * 1.5);
                gradient.addColorStop(0, 'rgba(147, 112, 219, 0.9)'); // Bright purple core
                gradient.addColorStop(0.4, 'rgba(138, 43, 226, 0.7)'); // Medium purple
                gradient.addColorStop(1, 'rgba(75, 0, 130, 0)'); // Dark purple fade
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, b.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Magical particles
                const particleCount = 4;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Date.now() / 1000 + i) * 5;
                    const distance = b.size * 0.8;
                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;
                    
                    const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, b.size * 0.4);
                    particleGradient.addColorStop(0, 'rgba(230, 230, 250, 0.8)'); // Bright particle
                    particleGradient.addColorStop(1, 'rgba(147, 112, 219, 0)'); // Fade to purple
                    
                    ctx.fillStyle = particleGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, b.size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Energy rings
                ctx.strokeStyle = 'rgba(147, 112, 219, 0.3)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 2; i++) {
                    const ringSize = b.size * (1.8 + i * 0.3);
                    const rotationOffset = (Date.now() / 1000) * (i + 1) * 2;
                    
                    ctx.beginPath();
                    for (let j = 0; j < 360; j += 45) {
                        const angle = (j + rotationOffset) * Math.PI / 180;
                        const x = Math.cos(angle) * ringSize;
                        const y = Math.sin(angle) * ringSize;
                        
                        if (j === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
                
                ctx.restore();
            } else {
                // Default projectile for other characters
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.fillStyle = '#4169E1';  // Royal Blue
                ctx.beginPath();
                ctx.arc(0, 0, b.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
    ctx.restore();
}

function drawPickups() {
    // Draw magnet pickups
    if (game.magnetPickups) {
        const len = game.magnetPickups.length;
        for (let i = 0; i < len; i++) {
            const pickup = game.magnetPickups[i];
            if (!pickup.active) continue;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(game.camera.zoom, game.camera.zoom);
            ctx.translate(-game.player.x, -game.player.y);

            // Pulse animation
            pickup.pulsePhase = (pickup.pulsePhase || 0) + 0.1;
            const scale = 1 + Math.sin(pickup.pulsePhase) * 0.1;

            ctx.translate(pickup.x, pickup.y);
            ctx.scale(scale, scale);

            // Draw magnet emoji
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧲', 0, 0);

            // Draw glow effect
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pickup.size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, pickup.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    const items = game.pickups;
    for (let i = 0, len = items.length; i < len; i++) {
        const item = items[i];
        ctx.save();
        ctx.translate(item.x, item.y);

        // Gölge efekti
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        if (item.type === 'diamond') {
            const t = performance.now() / 1000;
            const hoverOffset = Math.sin(t * 1.5) * 3; // Reduced from t*2 and 5 to t*1.5 and 3
            ctx.translate(0, hoverOffset);

            // Elmas şekli
            ctx.beginPath();
            ctx.moveTo(0, -item.size/2);
            ctx.lineTo(item.size/2, 0);
            ctx.lineTo(0, item.size/2);
            ctx.lineTo(-item.size/2, 0);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(-item.size/2, -item.size/2, item.size/2, item.size/2);
            gradient.addColorStop(0, '#24d21d');
            gradient.addColorStop(0.5, '#24d21d');
            gradient.addColorStop(1, '#24d21d');

            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Parıldama efekti - tek bir parıldama noktası
            ctx.beginPath();
            ctx.arc(-item.size/4, -item.size/4, item.size/8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // Reduced opacity from 0.8 to 0.6
            ctx.fill();

            // Dönme efekti - yavaşlatıldı
            ctx.rotate(t * 0.75); // Reduced from 1.5 to 0.75

        } else {
            // Ana daire
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#F4E6CC';
            ctx.beginPath();
            ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // İç parlama efekti
            const gradient = ctx.createRadialGradient(
                -item.size/4, -item.size/4, 0,
                -item.size/4, -item.size/4, item.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Cross işareti
            const crossSize = item.size * 0.7;
            const crossThickness = item.size * 0.15;
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;

            // Yatay çizgi
            ctx.beginPath();
            ctx.rect(-crossSize / 2, -crossThickness / 2, crossSize, crossThickness);
            ctx.fill();
            ctx.stroke();

            // Dikey çizgi
            ctx.beginPath();
            ctx.rect(-crossThickness / 2, -crossSize / 2, crossThickness, crossSize);
            ctx.fill();
            ctx.stroke();

            // Pırıltı efekti
            const t = performance.now() / 1000;
            const sparkleSize = item.size * 0.1 * (1 + Math.sin(t * 3) * 0.3);
            ctx.fillStyle = '#FFFFFF';

            for(let sp = 0; sp < 4; sp++) {
                const angle = t + sp * Math.PI/2;
                const x = Math.cos(angle) * item.size * 0.3;
                const y = Math.sin(angle) * item.size * 0.3;

                ctx.beginPath();
                ctx.arc(x, y, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
    ctx.restore();
}

function drawBooks() {
    if (!game.books.length) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const zoom = game.camera.zoom;
    const pX = game.player.x;
    const pY = game.player.y;
    const time = performance.now() / 1000;

    ctx.save();
    ctx.translate(cWidth / 2, cHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-pX, -pY);

    for (let i = 0, len = game.books.length; i < len; i++) {
        const book = game.books[i];
        const orbitRadius = BOOK_CONFIG.baseRadius + Math.sin(time + book.angle) * 20;
        const x = pX + Math.cos(book.angle) * orbitRadius;
        const y = pY + Math.sin(book.angle) * orbitRadius;

        // Magical particles
        for (let j = 0; j < 5; j++) {
            const particleAngle = book.angle + Math.sin(time * 2 + j) * 0.5;
            const particleRadius = orbitRadius + Math.cos(time * 3 + j) * 10;
            const px = pX + Math.cos(particleAngle) * particleRadius;
            const py = pY + Math.sin(particleAngle) * particleRadius;

            ctx.beginPath();
            ctx.fillStyle = `hsla(${(time * 50 + j * 50) % 360}, 70%, 60%, ${0.6 - j * 0.1})`;
            ctx.arc(px, py, 3 - j * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Book drawing
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(book.angle + Math.PI / 2);

        // Glow effect
        const glowIntensity = (Math.sin(time * 3 + book.angle) + 1) / 2;
        ctx.shadowColor = `rgba(65, 105, 225, ${glowIntensity})`;
        ctx.shadowBlur = 15;

        // Book cover
        ctx.fillStyle = `hsl(${(book.angle * 30 + time * 20) % 360}, 70%, 50%)`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        const size = game.player.size * 0.8;
        const startX = -game.player.size * 0.9;
        ctx.beginPath();
        ctx.rect(startX, -size/2, size, size);
        ctx.fillStyle = '#4b7bff';
        ctx.stroke();
        ctx.fill();

        // Kanat detayları - karenin ortasında
        ctx.strokeStyle = '#ffd644';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const centerX = startX + size/2;
        ctx.moveTo(centerX, -size/4);
        ctx.lineTo(centerX, size/4);
        ctx.moveTo(centerX - size/4, 0);
        ctx.lineTo(centerX + size/4, 0);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
}

function drawObjects(deltaTime) {
    drawGround();
    if (currentState === GameState.INTRO || currentState === GameState.GAME_OVER) {
        updateBloodDrops();
        drawBloodDrops();
        if (currentState === GameState.INTRO) {
            timeDisplay.textContent = '00:00';
            updateEnemies(deltaTime);
            drawEnemies();
        }
    }

    // World space transformasyonunu başlat
    ctx.save();
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const zoom = game.camera.zoom;
    const pX = game.player.x;
    const pY = game.player.y;

    ctx.translate(cWidth / 2, cHeight / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-pX, -pY);

    // Draw breakable objects
    if (game.breakableObjects && Array.isArray(game.breakableObjects)) {
        for (let i = 0, len = game.breakableObjects.length; i < len; i++) {
            const obj = game.breakableObjects[i];
            if (!obj || !obj.active) continue;

            ctx.save();
            ctx.translate(obj.x, obj.y);

            if (obj.isFlashing) {
                const flashDuration = obj.flashDuration;
                const now = performance.now();
                const timeSinceFlash = now - obj.flashStartTime;
                if (timeSinceFlash > flashDuration) {
                    obj.isFlashing = false;
                } else {
                    const flashIntensity = 1 - (timeSinceFlash / flashDuration);
                    ctx.globalAlpha = 0.5 + flashIntensity * 0.5;
                }
            }

            // Gölge efekti
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;

            // Ana kutu gövdesi (koyu kahverengi)
            ctx.fillStyle = '#3D2B1F';
            ctx.strokeStyle = '#2A1B0F';
            ctx.lineWidth = 3;
            ctx.fillRect(-obj.size/2, -obj.size/2, obj.size, obj.size);
            ctx.strokeRect(-obj.size/2, -obj.size/2, obj.size, obj.size);

            // Metal kenar detayları
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 4;
            const cornerSize = obj.size * 0.2;
            // Sol üst köşe
            ctx.beginPath();
            ctx.moveTo(-obj.size/2, -obj.size/2);
            ctx.lineTo(-obj.size/2 + cornerSize, -obj.size/2);
            ctx.moveTo(-obj.size/2, -obj.size/2);
            ctx.lineTo(-obj.size/2, -obj.size/2 + cornerSize);
            ctx.stroke();
            // Sağ üst köşe
            ctx.beginPath();
            ctx.moveTo(obj.size/2, -obj.size/2);
            ctx.lineTo(obj.size/2 - cornerSize, -obj.size/2);
            ctx.moveTo(obj.size/2, -obj.size/2);
            ctx.lineTo(obj.size/2, -obj.size/2 + cornerSize);
            ctx.stroke();
            // Sol alt köşe
            ctx.beginPath();
            ctx.moveTo(-obj.size/2, obj.size/2);
            ctx.lineTo(-obj.size/2 + cornerSize, obj.size/2);
            ctx.moveTo(-obj.size/2, obj.size/2);
            ctx.lineTo(-obj.size/2, obj.size/2 - cornerSize);
            ctx.stroke();
            // Sağ alt köşe
            ctx.beginPath();
            ctx.moveTo(obj.size/2, obj.size/2);
            ctx.lineTo(obj.size/2 - cornerSize, obj.size/2);
            ctx.moveTo(obj.size/2, obj.size/2);
            ctx.lineTo(obj.size/2, obj.size/2 - cornerSize);
            ctx.stroke();

            // Metal perçinler
            ctx.fillStyle = '#A0A0A0';
            const rivetSize = obj.size * 0.06;
            const rivetPositions = [
                {x: -obj.size/4, y: -obj.size/2},
                {x: obj.size/4, y: -obj.size/2},
                {x: -obj.size/4, y: obj.size/2},
                {x: obj.size/4, y: obj.size/2},
                {x: -obj.size/2, y: -obj.size/4},
                {x: -obj.size/2, y: obj.size/4},
                {x: obj.size/2, y: -obj.size/4},
                {x: obj.size/2, y: obj.size/4}
            ];

            for (let rv = 0, rvLen = rivetPositions.length; rv < rvLen; rv++) {
                const pos = rivetPositions[rv];
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, rivetSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Ahşap doku çizgileri
            ctx.strokeStyle = '#2A1B0F';
            ctx.lineWidth = 1;
            for(let w = 1; w < 3; w++) {
                const y = -obj.size/2 + (obj.size/3) * w;
                ctx.beginPath();
                ctx.moveTo(-obj.size/2 + cornerSize, y);
                ctx.lineTo(obj.size/2 - cornerSize, y);
                ctx.stroke();
            }

            // Kilit detayı
            ctx.fillStyle = '#696969';
            const lockSize = obj.size * 0.15;
            ctx.fillRect(-lockSize/2, -lockSize/2, lockSize, lockSize);
            ctx.strokeRect(-lockSize/2, -lockSize/2, lockSize, lockSize);
            // Anahtar deliği
            ctx.fillStyle = '#2A1B0F';
            ctx.beginPath();
            ctx.arc(0, 0, lockSize * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Health bar arka planı
            const healthBarWidth = obj.size;
            const healthBarHeight = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-healthBarWidth/2, -obj.size/2 - 12, healthBarWidth, healthBarHeight + 2);

            // Health bar
            const healthPercent = obj.health / 3;
            ctx.fillStyle = '#8B0000'; // Koyu kırmızı arka plan
            ctx.fillRect(-healthBarWidth/2, -obj.size/2 - 11, healthBarWidth, healthBarHeight);

            // Yeşil health göstergesi
            const gradient = ctx.createLinearGradient(-healthBarWidth/2, 0, healthBarWidth/2, 0);
            gradient.addColorStop(0, '#32CD32');
            gradient.addColorStop(1, '#98FB98');
            ctx.fillStyle = gradient;
            ctx.fillRect(-healthBarWidth/2, -obj.size/2 - 11, healthBarWidth * healthPercent, healthBarHeight);

            ctx.restore();
        }
    }

    // Draw health pickups
    if (game.healthPickups && Array.isArray(game.healthPickups)) {
        for (let i = 0, len = game.healthPickups.length; i < len; i++) {
            const pickup = game.healthPickups[i];
            if (!pickup || !pickup.active) continue;

            ctx.save();
            ctx.translate(pickup.x, pickup.y);

            // Pulse effect
            const scale = 1 + Math.sin(pickup.pulsePhase) * 0.1;
            ctx.scale(scale, scale);

            // Draw heart shape
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(0, pickup.size/4);
            ctx.bezierCurveTo(pickup.size/4, 0,
                              pickup.size/2, pickup.size/2, 
                              0, pickup.size);
            ctx.bezierCurveTo(-pickup.size/2, pickup.size/2,
                              -pickup.size/4, 0,
                              0, pickup.size/4);
            ctx.fill();

            // Enhanced glow effect
            const gradient = ctx.createRadialGradient(0, pickup.size/2, 0,
                                                      0, pickup.size/2, pickup.size * 1.5);
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.5)');
            gradient.addColorStop(0.5, 'rgba(255, 50, 50, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Add inner shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(-pickup.size/6, pickup.size/3, 
                        pickup.size/8, pickup.size/6,
                        -Math.PI/4, 0, Math.PI*2);
            ctx.fill();

            ctx.restore();
        }
    }

    // World space transformasyonunu bitir
    ctx.restore();

    if (game.lootChest && !game.lootChest.collected) {
        drawChest(game.lootChest);
    }
    drawPlayer();
    drawBulletParticles();
    drawBullets();
    drawBurnEffects(); // Draw burn effects before fireballs
    drawFireballs();
    drawLightnings();
    drawSparkParticles();
    drawFrostbolts();
    drawEnemies();
    drawBooks();
    drawDoor();
    
    updateEnemies(deltaTime);
    if (currentState === GameState.PLAYING || currentState === GameState.INTRO || currentState === GameState.GAME_OVER) {
        if (game.gameTime >= game.nextEnemySpawnTime) {
            spawnEnemies();
            game.nextEnemySpawnTime = game.gameTime + Math.random() * 2.5 + 0.5;
        }
        if (game.score - game.lastBossSpawnScore >= 100) {
            spawnBoss();
            game.lastBossSpawnScore = game.score;
        }
    }

    if (game.boss) {
        drawBossArena();
        drawBoss();
        updateBoss(deltaTime);
    }
    
    drawPickups();
    drawParticles();
    updateParticles();
    drawAuraEffects();
    drawExpOrbs();
    
    // Tüm nesneleri çizdikten sonra fog of war'u en üste çiz
    drawFogOfWar();
}

function drawChest(chest) {
    // Mikro optimizasyon: tekrar eden değerleri lokal değişkenlerde tutalım
    const cw = canvas.width;
    const ch = canvas.height;
    const pX = game.player.x;
    const pY = game.player.y;
    const now = performance.now();
    const timeSec = now / 1000;
    const twoPI = Math.PI * 2;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    // Parlama efekti
    const time = performance.now() / 1000;
    const glowSize = 5 + Math.sin(time * 3) * 2;

    // Dış parlama
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = glowSize;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Ana sandık gövdesi
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Sandık gövdesi
    ctx.beginPath();
    ctx.rect(chest.x - chest.width/2, chest.y - chest.height/2, chest.width, chest.height);
    ctx.fill();
    ctx.stroke();

    // Sandık kapağı
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.rect(chest.x - chest.width/2, chest.y - chest.height/2, chest.width, chest.height/3);
    ctx.fill();
    ctx.stroke();

    // Metal detaylar
    ctx.fillStyle = '#FFD700';

    // Kilit
    ctx.beginPath();
    ctx.arc(chest.x, chest.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Köşe süslemeleri
    const cornerSize = 4;
    const corners = [
        {x: chest.x - chest.width/2 + cornerSize, y: chest.y - chest.height/2 + cornerSize},
        {x: chest.x + chest.width/2 - cornerSize, y: chest.y - chest.height/2 + cornerSize},
        {x: chest.x - chest.width/2 + cornerSize, y: chest.y + chest.height/2 - cornerSize},
        {x: chest.x + chest.width/2 - cornerSize, y: chest.y + chest.height/2 - cornerSize}
    ];

    corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, cornerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });

    // Parıltı efekti
    const sparkleCount = 3;
    const sparkleRadius = 15;
    for (let i = 0; i < sparkleCount; i++) {
        const sparkleAngle = time * 2 + (i * Math.PI * 2 / sparkleCount);
        const sparkleX = chest.x + Math.cos(sparkleAngle) * sparkleRadius;
        const sparkleY = chest.y + Math.sin(sparkleAngle) * sparkleRadius;

        ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(time * 5 + i) * 0.5})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Üstteki parıltı
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
        chest.x - chest.width/4,
        chest.y - chest.height/4,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
}

function drawDoor() {
    if (!game.door || !game.door.active || !game.doorArrow) return;

    // Mikro optimizasyon: tekrar eden değerleri lokal değişkenlerde tutalım
    const cw = canvas.width;
    const ch = canvas.height;
    const pX = game.player.x;
    const pY = game.player.y;
    const dX = game.door.x;
    const dY = game.door.y;
    const now = performance.now();
    const timeSec = now / 1000;
    const twoPI = Math.PI * 2;

    const dx = game.door.x - game.player.x;
    const dy = game.door.y - game.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    const time = performance.now() / 1000;
    game.door.pulseTime += 0.016;

    // Kapı çizimi
    ctx.save();
    ctx.translate(game.door.x, game.door.y);

    // Parlama efekti
    const glowSize = game.door.size * (1.2 + Math.sin(game.door.pulseTime * 2) * 0.2);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Kapı ana gövdesi
    ctx.fillStyle = '#4a4a4a';
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, game.door.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Portal efekti
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        ctx.save();
        ctx.rotate(angle);
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(time * 3 + i) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(game.door.size / 4, 0);
        ctx.lineTo(game.door.size / 2.5, 0);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();

    // Ok çizimi
    if (game.doorArrow.visible) {
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        ctx.rotate(angle);

        const distanceFromPlayer = 50;
        ctx.translate(distanceFromPlayer, 0);

        const bounceOffset = Math.sin(time * 3) * 15;
        const baseArrowLength = 60;
        const arrowWidth = 20;
        const pulseScale = 1 + Math.sin(time * 2) * 0.1;

        ctx.translate(bounceOffset, 0);

        // Outline için gölge efekti
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Ok şekli
        ctx.beginPath();
        ctx.moveTo(20, -3 * pulseScale);
        ctx.lineTo(baseArrowLength - 15, -3 * pulseScale);
        ctx.lineTo(baseArrowLength - 15, -arrowWidth/2 * pulseScale);
        ctx.lineTo(baseArrowLength + 5, 0);
        ctx.lineTo(baseArrowLength - 15, arrowWidth/2 * pulseScale);
        ctx.lineTo(baseArrowLength - 15, 3 * pulseScale);
        ctx.lineTo(20, 3 * pulseScale);
        ctx.closePath();

        // İç dolgu
        ctx.fillStyle = '#FFD700';
        ctx.fill();

        // Outline (dış çizgi)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Mesafe metnini ekle
        ctx.save();
        ctx.rotate(-angle); // Metni düz tutmak için rotasyonu geri al
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const meters = Math.round(distance / 50);
        ctx.strokeText(`${meters}m`, 0, -10);
        ctx.fillText(`${meters}m`, 0, -10);
        ctx.restore();

        // Gölge efektini kaldır
        ctx.shadowColor = 'transparent';

        ctx.restore();
    }

    ctx.restore();
}

function drawFrostbolts() {
    if (!game.activeFrostbolts?.length) return;

    // Mikro optimizasyon: tekrar eden değerleri lokal değişkenlerde tutalım
    const cw = canvas.width;
    const ch = canvas.height;
    const pX = game.player.x;
    const pY = game.player.y;
    const twoPI = Math.PI * 2;

    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    game.activeFrostbolts.forEach(frost => {
        const baseRadius = frost.radius || 20;
        const explosionRadius = baseRadius * 3;
        const progress = frost.progress || 0;

        if (!frost.hasExploded) {
            ctx.save();
            ctx.translate(frost.x, frost.y);
            ctx.rotate(frost.rotation || 0);

            // Ice crystal core
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius);
            coreGradient.addColorStop(0, '#ffffff');
            coreGradient.addColorStop(0.4, '#48A9E6');
            coreGradient.addColorStop(0.7, '#1E90FF');
            coreGradient.addColorStop(1, '#104E8B');

            ctx.beginPath();
            ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();

            // Crystal spikes
            for (let i = 0; i < 6; i++) {
                const angle = (i/6) * Math.PI * 2 + progress * 2;
                const spikeLength = baseRadius * 0.8;

                ctx.save();
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.moveTo(baseRadius, -5);
                ctx.lineTo(baseRadius + spikeLength, 0);
                ctx.lineTo(baseRadius, 5);
                ctx.closePath();

                const spikeGradient = ctx.createLinearGradient(
                    baseRadius, 0,
                    baseRadius + spikeLength, 0
                );
                spikeGradient.addColorStop(0, '#48A9E6');
                spikeGradient.addColorStop(1, '#ffffff');

                ctx.fillStyle = spikeGradient;
                ctx.fill();
                ctx.restore();
            }

            // Frozen trail
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const waveHeight = Math.sin(progress * 10 + i) * 8;
                ctx.moveTo(-baseRadius - 30, i * 5);
                ctx.quadraticCurveTo(
                    -baseRadius - 15, waveHeight,
                    -baseRadius, i * 5
                );
            }

            const trailGradient = ctx.createLinearGradient(
                -baseRadius - 30, 0,
                -baseRadius, 0
            );
            trailGradient.addColorStop(0, 'rgba(30,144,255,0)');
            trailGradient.addColorStop(1, 'rgba(30,144,255,0.8)');

            ctx.strokeStyle = trailGradient;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Magical particles
            for (let i = 0; i < 2; i++) { // Reduced from 3 to 2
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * baseRadius * 1.5;
                const size = Math.random() * 3 + 1;

                ctx.beginPath();
                ctx.arc(
                    Math.cos(angle) * dist,
                    Math.sin(angle) * dist,
                    size, 0, Math.PI * 2
                );
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.5})`;
                ctx.fill();
            }

            ctx.restore();
        } else {
            // Explosion effect
            const explosionProgress = progress / 0.5;
            const currentRadius = explosionRadius * (1 - explosionProgress);

            const explodeGradient = ctx.createRadialGradient(
                frost.x, frost.y, 0,
                frost.x, frost.y, currentRadius
            );
            explodeGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
            explodeGradient.addColorStop(0.4, 'rgba(72,169,230,0.6)');
            explodeGradient.addColorStop(1, 'rgba(30,144,255,0)');

            ctx.beginPath();
            ctx.arc(frost.x, frost.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = explodeGradient;
            ctx.fill();
        }

        // Outer glow
        ctx.globalCompositeOperation = 'lighter';
        const glowRadius = frost.hasExploded ?
            explosionRadius * (1 - progress/0.5) * 1.2 :
            baseRadius * 1.5;

        const glowGradient = ctx.createRadialGradient(
            frost.x, frost.y, 0,
            frost.x, frost.y, glowRadius
        );
        glowGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        glowGradient.addColorStop(0.5, 'rgba(72,169,230,0.2)');
        glowGradient.addColorStop(1, 'rgba(30,144,255,0)');

        ctx.beginPath();
        ctx.arc(frost.x, frost.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    });

    ctx.restore();
}

function showJackpotScreen() {
    const skills = [
        { id: 'fireball', icon: '🔥', title: 'Fireball' },
        { id: 'chainLightning', icon: '⚡', title: 'Chain Lightning' },
        { id: 'frostbolt', icon: '❄️', title: 'Frostbolt' },
        { id: 'books', icon: '📚', title: 'Books' },
        { id: 'projectiles', icon: '🎯', title: 'Multi-Shot' },
        { id: 'firerate', icon: '🔥', title: 'Rapid Fire' },
        { id: 'pierce', icon: '💥', title: 'Piercing Shot' },
        { id: 'aura', icon: '💫', title: 'Holy Aura' }
    ];

    const jackpotScreen = document.createElement('div');
    jackpotScreen.className = 'jackpot-screen';

    const style = document.createElement('style');
    style.textContent = `
    .jackpot-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .jackpot-container {
        width: 300px;
        height: 650px;
        background: linear-gradient(145deg, #1a1a1a, #000000);
        position: relative;
        overflow: hidden;
        border-radius: 40px;
        box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
    }
    
    .jackpot-container::before {
        content: '';
        position: absolute;
        inset: 0;
        border: 3px solid #FFD700;
        border-radius: 40px;
        box-shadow: 
            0 0 20px #FFD700,
            inset 0 0 20px #FFD700;
        pointer-events: none;
        animation: glowPulse 2s infinite;
    }
    
    @keyframes glowPulse {
        0% { box-shadow: 0 0 20px #FFD700, inset 0 0 20px #FFD700; }
        50% { box-shadow: 0 0 40px #FFD700, inset 0 0 40px #FFD700; }
        100% { box-shadow: 0 0 20px #FFD700, inset 0 0 20px #FFD700; }
    }
    
    .skill-viewport {
        width: 240px;
        height: 240px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 20px;
        background: linear-gradient(145deg, #2a2a2a, #000000);
        overflow: hidden;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
    }
    
    .skill-viewport::before {
        content: '';
        position: absolute;
        inset: 0;
        border: 3px solid #FFD700;
        border-radius: 20px;
        box-shadow: 
            0 0 15px #FFD700,
            inset 0 0 15px #FFD700;
        pointer-events: none;
        z-index: 1;
    }
    
    .skill-list {
        position: absolute;
        width: 100%;
        transition: transform 4s cubic-bezier(0.21, 0.53, 0.29, 0.99);
    }
    
    .skill-item {
        width: 240px;
        height: 240px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(145deg, #2a2a2a, #111111);
        position: relative;
        overflow: hidden;
    }
    
    .skill-icon {
        font-size: 48px;
        margin: 10px 0;
        animation: floatAnimation 2s infinite;
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
    }
    
    .skill-title {
        font-size: 16px;
        color: #FFD700;
        text-shadow: 0 0 10px #FFD700;
        font-weight: bold;
    }
    
    @keyframes floatAnimation {
        0% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
        100% { transform: translateY(0); }
    }

    .result-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s;
    }
    
    .result-content {
        text-align: center;
        transform: scale(0);
        transition: transform 0.5s;
    }
    
    .result-icon {
        font-size: 80px;
        margin-bottom: 20px;
        animation: resultIconAnimation 1s infinite;
    }
    
    @keyframes resultIconAnimation {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .result-title {
        font-size: 32px;
        color: #FFD700;
        text-shadow: 0 0 15px #FFD700;
        margin-bottom: 10px;
    }
    
    .result-description {
        font-size: 18px;
        color: #fff;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.className = 'jackpot-container';

    const viewport = document.createElement('div');
    viewport.className = 'skill-viewport';

    const skillList = document.createElement('div');
    skillList.className = 'skill-list';

    // Her skill için yükseklik
    const itemHeight = 240;

    // Viewport'un yüksekliği
    const viewportHeight = 240;

    // Viewport'un orta noktası
    const centerOffset = (viewportHeight - itemHeight) / 2;

    // Skills'i 4-5 kez tekrarla
    const repeatedSkills = [...skills, ...skills, ...skills, ...skills, ...skills];
    repeatedSkills.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <div class="skill-icon">${skill.icon}</div>
            <div class="skill-title">${skill.title}</div>
        `;
        skillList.appendChild(skillItem);
    });

    viewport.appendChild(skillList);
    container.appendChild(viewport);
    jackpotScreen.appendChild(container);
    document.body.appendChild(jackpotScreen);

    // Ses efekti
    playSlotSound();

    const totalItems = skills.length;
    const chosenSkillIndex = Math.floor(Math.random() * totalItems);

    // Seçilen skill'i ortala
    const finalPosition = -(
        (totalItems * 2 * itemHeight) + // 2 tam tur
        (chosenSkillIndex * itemHeight) + // seçilen skill'e kadar
        centerOffset // ortala
    );

    // Başlangıç pozisyonu
    skillList.style.transform = 'translateY(0px)';

    setTimeout(() => {
        skillList.style.transform = `translateY(${finalPosition}px)`;

        skillList.addEventListener('transitionend', () => {
            const selectedSkill = skills[chosenSkillIndex];
            applyUpgrade(selectedSkill.id);
            showSelectedSkill(selectedSkill);
        }, { once: true });
    }, 100);
}

function showSelectedSkill(skill) {
    return new Promise((resolve) => {
        const resultOverlay = document.createElement('div');
        resultOverlay.className = 'result-overlay';

        resultOverlay.innerHTML = `
            <div class="result-content">
                <div class="result-icon">${skill.icon}</div>
                <div class="result-title">${skill.title}</div>
                <div class="result-description">Level ${game.playerUpgrades[skill.id]} → ${game.playerUpgrades[skill.id] + 1}</div>
            </div>
        `;

        document.body.appendChild(resultOverlay);
        document.querySelector('.jackpot-screen').remove(); // Jackpot ekranını da kaldır
        currentState = GameState.UPGRADING;
        
        // Animasyon
        setTimeout(() => {
            resultOverlay.style.opacity = '1';
            resultOverlay.querySelector('.result-content').style.transform = 'scale(1)';
        }, 100);

        // Sonucu kaldır ve oyunu devam ettir
        setTimeout(() => {
            resultOverlay.style.opacity = '0';
            resultOverlay.querySelector('.result-content').style.transform = 'scale(0)';
            setTimeout(() => {
                resultOverlay.remove();
                currentState = GameState.PLAYING;
                resolve(); // İşlem tamamlandığında Promise'i resolve et
            }, 500);
        }, 1000);
    });
}

function drawBloodDrops() {
    // Mikro optimizasyon: Tekrar eden değerleri lokal değişkenlerde tutalım
    const bdLength = bloodDrops.length;

    ctx.save();

    // Her damla için cartoon stil
    bloodDrops.forEach(drop => {
        // Ana damla
        ctx.strokeStyle = '#000000';  // Outline için siyah
        ctx.lineWidth = 2;  // Kalın outline
        ctx.fillStyle = '#FF0000';  // Parlak kırmızı

        const dropWidth = 4;
        const dropLength = drop.length;

        // Damla şekli (gözyaşı damlası şeklinde)
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.bezierCurveTo(
            drop.x - dropWidth, drop.y + dropLength * 0.3,
            drop.x - dropWidth, drop.y + dropLength * 0.5,
            drop.x, drop.y + dropLength
        );
        ctx.bezierCurveTo(
            drop.x + dropWidth, drop.y + dropLength * 0.5,
            drop.x + dropWidth, drop.y + dropLength * 0.3,
            drop.x, drop.y
        );
        ctx.closePath();

        // Gölge efekti
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fill();  // Damlayı doldur
        ctx.stroke(); // Outline ekle

        // Parlama efekti
        const gradient = ctx.createLinearGradient(
            drop.x - dropWidth, drop.y,
            drop.x + dropWidth, drop.y + dropLength
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
    });

    ctx.restore();
}

function interpolateColor(baseColor, flashColor, intensity) {
    // If baseColor is an array, use it directly
    let baseRGB = Array.isArray(baseColor) ? baseColor : [
        parseInt(baseColor.slice(1,3),16),
        parseInt(baseColor.slice(3,5),16),
        parseInt(baseColor.slice(5,7),16)
    ];

    // If flashColor is an array, use it directly
    let targetRGB = Array.isArray(flashColor) ? flashColor : [
        parseInt(flashColor.slice(1,3),16),
        parseInt(flashColor.slice(3,5),16),
        parseInt(flashColor.slice(5,7),16)
    ];

    return [
        Math.floor(baseRGB[0] + (targetRGB[0] - baseRGB[0]) * intensity),
        Math.floor(baseRGB[1] + (targetRGB[1] - baseRGB[1]) * intensity),
        Math.floor(baseRGB[2] + (targetRGB[2] - baseRGB[2]) * intensity)
    ];
}

function rgbToString(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function drawBossArena() {
    if (!game.bossArena) return;

    // Mikro optimizasyon: tekrar eden değerleri lokal değişkenlerde tutalım
    const cw = canvas.width;
    const ch = canvas.height;
    const pX = game.player.x;
    const pY = game.player.y;
    const now = performance.now();
    const timeSec = now / 1000;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    // Arena aktif değilse yok olma animasyonu
    const opacity = game.bossArena.active ? 0.5 : 
        Math.max(0, (game.bossArena.fadeStartTime + 1000 - performance.now()) / 1000);

    // Tüm canvas'ı kaplayan siyah overlay
    const screenSize = Math.max(canvas.width, canvas.height) / game.camera.zoom;
    ctx.fillStyle = `rgba(0, 0, 0, 0)`;
    ctx.fillRect(
        game.player.x - screenSize,
        game.player.y - screenSize,
        screenSize * 2,
        screenSize * 2
    );

    // Arena dışını karart
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.rect(game.player.x - screenSize, game.player.y - screenSize, screenSize * 2, screenSize * 2);
    ctx.arc(game.bossArena.x, game.bossArena.y, game.bossArena.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();
    ctx.restore();

    // Arena sınırlarını çiz
    ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(game.bossArena.x, game.bossArena.y, game.bossArena.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Arena bariyeri efekti
    const gradient = ctx.createRadialGradient(
        game.bossArena.x, game.bossArena.y, game.bossArena.radius - 10,
        game.bossArena.x, game.bossArena.y, game.bossArena.radius
    );
    gradient.addColorStop(0, `rgba(255, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(255, 0, 0, ${opacity * 0.4})`);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

function drawAuraEffects() {
    if (!game.activeAuraEffects || !game.activeAuraEffects.length) return;

    // Mikro optimizasyon: tekrar eden değerleri lokal değişkenlerde tutalım
    const cw = canvas.width;
    const ch = canvas.height;
    const pX = game.player.x;
    const pY = game.player.y;
    const now = performance.now();
    const timeSec = now / 1000;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    game.activeAuraEffects.forEach(aura => {
        if (!aura.active) return;

        // Ana aura efekti
        const gradient = ctx.createRadialGradient(
            aura.x, aura.y, 0,
            aura.x, aura.y, aura.radius
        );
        gradient.addColorStop(0, `rgba(75, 0, 130, ${aura.opacity * 0.5})`);
        gradient.addColorStop(0.7, `rgba(75, 0, 130, ${aura.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, aura.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dış çizgi efekti
        ctx.strokeStyle = `rgba(147, 112, 219, ${aura.opacity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(aura.x, aura.y, aura.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Parçacık efektleri
        const particleCount = 8;
        const time = performance.now() / 1000;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + time;
            const x = aura.x + Math.cos(angle) * aura.radius;
            const y = aura.y + Math.sin(angle) * aura.radius;
            
            ctx.fillStyle = `rgba(147, 112, 219, ${aura.opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.restore();
}

function drawExpOrbs() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    // Draw only active orbs from the pool
    for (const orb of gameObjectPools.expOrbPool.active) {
        if (!orb.active || orb.collected) continue;

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.fill();

        // Add glow effect
        const gradient = ctx.createRadialGradient(
            orb.x, orb.y, 0,
            orb.x, orb.y, orb.size * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.restore();
}

function drawFogOfWar() {
    // Event aktif değilse fog çizme
    if (!game.player || !FOG_EVENT.ACTIVE && !FOG_EVENT.START_TIME) return;

    const { width, height } = canvas;
    const now = performance.now();
    
    // Fog of war için yeni bir canvas context oluştur
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = width;
    fogCanvas.height = height;
    const fogCtx = fogCanvas.getContext('2d');

    // Opacity hesaplama
    let opacity = 1;
    if (FOG_EVENT.START_TIME) {
        const elapsedTime = now - FOG_EVENT.START_TIME;
        
        if (FOG_EVENT.ACTIVE) {
            // Fade in effect
            if (elapsedTime < FOG_EVENT.FADE_DURATION) {
                opacity = elapsedTime / FOG_EVENT.FADE_DURATION;
            }
            
            // Fade out effect for ending
            const timeLeft = FOG_EVENT.DURATION - elapsedTime;
            if (timeLeft < FOG_EVENT.WARNING_TIME) {
                opacity = timeLeft / FOG_EVENT.WARNING_TIME;
            }
        } else {
            // Final fade out after event ends
            const fadeOutTime = elapsedTime - FOG_EVENT.DURATION;
            if (fadeOutTime < FOG_EVENT.FADE_DURATION) {
                opacity = 1 - (fadeOutTime / FOG_EVENT.FADE_DURATION);
            } else {
                return; // Completely faded out
            }
        }
    }

    // Ekranı karanlıkla doldur
    fogCtx.fillStyle = `rgba(0, 0, 0, ${0.85 * opacity})`;
    fogCtx.fillRect(0, 0, width, height);

    // Oyuncunun etrafındaki görüş alanını hesapla
    const centerX = width / 2;
    const centerY = height / 2;

    // Radial gradient oluştur
    const gradient = fogCtx.createRadialGradient(
        centerX, centerY, FOG_OF_WAR.VISIBLE_RADIUS, // İç yarıçap
        centerX, centerY, FOG_OF_WAR.VISIBLE_RADIUS
    );

    // Gradient'i güncelle - orta kısım tamamen şeffaf
    gradient.addColorStop(0, FOG_OF_WAR.COLOR); // İç kısım karanlık
    gradient.addColorStop(0.1, 'transparent'); // Ani geçiş
    gradient.addColorStop(0.7, 'transparent'); // Şeffaf bölge devam ediyor
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.85 * opacity})`); // Dış kısım karanlık

    // Görüş alanını çiz
    fogCtx.globalCompositeOperation = 'destination-out';
    fogCtx.beginPath();
    
    // Önce tamamen şeffaf iç daire
    fogCtx.arc(centerX, centerY, FOG_OF_WAR.VISIBLE_RADIUS * 0.6, 0, Math.PI * 2);
    fogCtx.fill();
    
    // Sonra geçiş bölgesi
    fogCtx.beginPath();
    fogCtx.arc(centerX, centerY, FOG_OF_WAR.VISIBLE_RADIUS + FOG_OF_WAR.TRANSITION_RADIUS, 0, Math.PI * 2);
    fogCtx.arc(centerX, centerY, FOG_OF_WAR.VISIBLE_RADIUS * 0.6, 0, Math.PI * 2, true);
    fogCtx.fillStyle = gradient;
    fogCtx.fill();

    // Ana canvas'a fog of war'u çiz
    ctx.globalAlpha = opacity;
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.globalAlpha = 1;
}

function drawBurnEffects() {
    if (!game.activeBurnEffects) return;

    // Kamera transformasyonlarını uygula
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    game.activeBurnEffects.forEach(effect => {
        if (!effect.active) return;

        const progress = (performance.now() - effect.startTime) / BURN_DURATION;
        const opacity = 0.4 * (1 - progress);
        
        // Draw the base fire circle
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 50, 0, ${opacity * 0.5})`;
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw animated fire particles
        const particleCount = 12;
        const time = performance.now() / 1000;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + time;
            const waveOffset = Math.sin(time * 3 + i) * 10;
            const radius = effect.radius + waveOffset;
            
            const x = effect.x + Math.cos(angle) * radius;
            const y = effect.y + Math.sin(angle) * radius;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, `rgba(255, 150, 0, ${opacity})`);
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.restore();
}
