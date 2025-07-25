function findNearestEnemyInRange(range) {
    const pX = game.player.x;
    const pY = game.player.y;

    let nearestDistance = Infinity;
    let nearestEnemy = null;
    
    game.enemies.forEach(enemy => {
        const dx = enemy.x - pX;
        const dy = enemy.y - pY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range && distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    if (game.boss) {
        const dx = game.boss.x - pX;
        const dy = game.boss.y - pY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range && distance < nearestDistance) {
            nearestEnemy = game.boss;
        }
    }

    return nearestEnemy;
}

function drawBoss() {
    if (!game.boss) return;

    const boss = game.boss;
    const pX = game.player.x;
    const pY = game.player.y;
    const bX = boss.x;
    const bY = boss.y;
    const bSize = boss.size;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-pX, -pY);

    let flashIntensity = 0;
    if (boss.isFlashing) {
        const now = performance.now();
        const timeSinceFlash = now - boss.flashStartTime;
        if (timeSinceFlash < boss.flashDuration) {
            flashIntensity = Math.sin((1 - timeSinceFlash / boss.flashDuration) * Math.PI);
        } else {
            boss.isFlashing = false;
        }
    }

    const time = performance.now() / 1000;
    boss.effects.pulseTime += 0.016;
    boss.effects.glowIntensity = Math.sin(boss.effects.pulseTime * 2) * 0.3 + 0.7;
    boss.effects.rotationAngle += 0.01;

    // Renk interpolasyonu için yardımcı fonksiyon (aynı kalsın)
    function interpolateColor(color, flashColor, intensity) {
        function hslToRgb(h, s, l) {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        function parseHSL(hslStr) {
            const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                return hslToRgb(match[1]/360, match[2]/100, match[3]/100);
            }
            return null;
        }

        let baseRGB;
        if (color.startsWith('hsl')) {
            baseRGB = parseHSL(color);
        } else {
            baseRGB = [parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)];
        }

        const targetRGB = [255, 255, 255];

        return `rgb(${
            Math.round(baseRGB[0] + (targetRGB[0] - baseRGB[0]) * intensity)},${
            Math.round(baseRGB[1] + (targetRGB[1] - baseRGB[1]) * intensity)},${
            Math.round(baseRGB[2] + (targetRGB[2] - baseRGB[2]) * intensity)})`;
    }

    // Dracula teması için renkler
    const draculaMainColor = interpolateColor('#280028', '#FFFFFF', flashIntensity);
    const draculaCapeColor = interpolateColor('#500000', '#FFFFFF', flashIntensity);
    const draculaEyeColor = interpolateColor('#FF0000', '#FFFFFF', flashIntensity);
    const draculaSkinColor = interpolateColor('#DCDCEB', '#FFFFFF', flashIntensity);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Pelerin (arka kısım)
    ctx.fillStyle = draculaCapeColor;
    ctx.beginPath();
    ctx.moveTo(bX, bY - bSize/2);
    ctx.quadraticCurveTo(
        bX - bSize * 1.2, bY,
        bX - bSize * 0.8, bY + bSize/2
    );
    ctx.lineTo(bX + bSize * 0.8, bY + bSize/2);
    ctx.quadraticCurveTo(
        bX + bSize * 1.2, bY,
        bX, bY - bSize/2
    );
    ctx.fill();
    ctx.stroke();

    // Ana gövde (kostüm)
    ctx.fillStyle = draculaMainColor;
    ctx.beginPath();
    ctx.rect(bX - bSize/2, bY - bSize/2, bSize, bSize);
    ctx.fill();
    ctx.stroke();

    // Yüz
    ctx.fillStyle = draculaSkinColor;
    ctx.beginPath();
    ctx.arc(bX, bY - bSize/4, bSize/3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gözler
    const eyeGradient = ctx.createRadialGradient(
        bX - bSize/6, bY - bSize/4, 0,
        bX - bSize/6, bY - bSize/4, bSize/8
    );
    eyeGradient.addColorStop(0, draculaEyeColor);
    eyeGradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');

    [-bSize/6, bSize/6].forEach(offset => {
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(bX + offset, bY - bSize/4, bSize/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });

    // Vampir dişleri
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(bX - bSize/8, bY);
    ctx.lineTo(bX - bSize/16, bY + bSize/8);
    ctx.lineTo(bX, bY);
    ctx.moveTo(bX + bSize/8, bY);
    ctx.lineTo(bX + bSize/16, bY + bSize/8);
    ctx.lineTo(bX, bY);
    ctx.fill();
    ctx.stroke();

    // Pelerin yaka detayları
    ctx.fillStyle = draculaCapeColor;
    ctx.beginPath();
    ctx.moveTo(bX - bSize/2, bY - bSize/3);
    ctx.lineTo(bX - bSize*0.8, bY);
    ctx.lineTo(bX - bSize/3, bY);
    ctx.closePath();
    ctx.moveTo(bX + bSize/2, bY - bSize/3);
    ctx.lineTo(bX + bSize*0.8, bY);
    ctx.lineTo(bX + bSize/3, bY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Yarasalar
    const batsCount = 8;
    for(let i = 0; i < batsCount; i++) {
        const angle = (time + i * (Math.PI * 2 / batsCount));
        const distance = bSize * 0.8;
        const batX = bX + Math.cos(angle) * distance;
        const batY = bY + Math.sin(angle) * distance;
        const batSize = bSize * 0.15;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        // Yarasa gövdesi
        ctx.beginPath();
        ctx.ellipse(batX, batY, batSize/2, batSize/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Kanatlar
        const wingSpan = Math.sin(time * 5) * 0.5;
        [-1, 1].forEach(side => {
            ctx.beginPath();
            ctx.moveTo(batX, batY);
            ctx.quadraticCurveTo(
                batX + side * batSize/2,
                batY - batSize/2 + wingSpan * batSize,
                batX + side * batSize,
                batY
            );
            ctx.fill();
        });
    }

    // Enrage efektleri
    if (boss.enrageProperties.isEnraged) {
        boss.enrageProperties.enrageColorPulse += 0.1;
        ctx.globalAlpha = 0.3;
        const enrageGlow = ctx.createRadialGradient(
            bX, bY, 0, bX, bY, bSize * 2
        );
        enrageGlow.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        enrageGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = enrageGlow;
        ctx.beginPath();
        ctx.arc(bX, bY, bSize * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Kan damlası efekti
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * bSize;
            const dropX = bX + Math.cos(angle) * distance;
            const dropY = bY + Math.sin(angle) * distance;

            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(dropX, dropY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Health bar (orijinal koddan)
    const w = bSize * 1.5;
    const h = 10;
    const p = Math.max(boss.health / BOSS_MAX_HEALTH, 0);

    ctx.fillStyle = '#FF0000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(bX - w / 2, bY - bSize / 2 - 20, w, h);
    ctx.fill();
    ctx.stroke();

    const healthGradient = ctx.createLinearGradient(
        bX - w / 2,
        bY - bSize / 2 - 20,
        bX - w / 2 + w * p,
        bY - bSize / 2 - 20 + h
    );

    if (p > 0.6) {
        healthGradient.addColorStop(0, '#00FF00');
        healthGradient.addColorStop(1, '#00CC00');
    } else if (p > 0.3) {
        healthGradient.addColorStop(0, '#FFFF00');
        healthGradient.addColorStop(1, '#CCCC00');
    } else {
        healthGradient.addColorStop(0, '#FF0000');
        healthGradient.addColorStop(1, '#CC0000');
    }

    ctx.fillStyle = healthGradient;
    ctx.fillRect(
        bX - w / 2,
        bY - bSize / 2 - 20,
        w * p,
        h
    );

    ctx.restore();
}

function handleEnemyHit(enemy) {
    // If it's a shielder with shield, handle shield damage but don't return early
    if (enemy.type === 'shielder' && enemy.shield) {
        enemy.shieldHealth--;
        if (enemy.shieldHealth <= 0) {
            enemy.shield = false;
        }
        // Only return if the enemy still has health
        if (enemy.health > 0) {
            return;
        }
    }

    if (enemy.type === 'splitter' && !enemy.isChild) {
        splitEnemy(enemy);
    }

    // Create death particles
    createDeathParticles(enemy.x, enemy.y);

    // Diamond (EXP) drop %100 şansla
    if (Math.random() < 1) {  // 100% şans
        const pickup = gameObjectPools.get('pickup');
        pickup.x = enemy.x;
        pickup.y = enemy.y;
        pickup.spawnX = enemy.x;
        pickup.spawnY = enemy.y;
        pickup.size = ENEMY_SIZE / 2;
        pickup.type = 'diamond';
        pickup.value = 1;
        pickup.active = true;
        pickup.hasPositioned = false;
        pickup.moveProgress = 0;
        pickup.magnetInitialized = false;

        game.pickups.push(pickup);
        playSound('pickupDrop', 0.8, 0.8);
    }

    // Ses efekti
    playSound('enemyDeath', 1, 0.1);

    // Normal heal orb drop şansı
    let currentDropRate = PICKUP_DROP_RATE;
    if (game.gameTime < 60) {
        currentDropRate = 0.02;
    }

    if (Math.random() < currentDropRate / Math.pow(2, game.bossesKilled)) {
        const healPickup = gameObjectPools.get('pickup');
        healPickup.x = enemy.x;
        healPickup.y = enemy.y;
        healPickup.size = ENEMY_SIZE;
        healPickup.type = 'heal';
        healPickup.active = true;
        healPickup.magnetInitialized = false;
        game.pickups.push(healPickup);
        playSound('pickupDrop', 0.8, 0.8);
    }

    if (enemy === game.boss) {
        // Boss öldüğünde önce arenayı deaktive et, sonra kaldır
        if (game.bossArena) {
            game.bossArena.active = false;
            game.bossArena.fadeStartTime = performance.now();
            setTimeout(() => {
                game.bossArena = null;
            }, 1000);
        }
        
        // Zafer efekti
        createVictoryEffect(enemy.x, enemy.y);
        showFloatingText('🏆 BOSS DEFEATED!', enemy.x, enemy.y, 'critical');
        
        // İlk boss öldüğünde (game.bossesKilled === 0), bir sonraki boss spawn zamanını ayarla
        if (game.bossesKilled === 0) {
            // Şu anki zamanı al ve üzerine 1 dakika ekle
            const currentTime = Math.floor(game.gameTime);
            game.nextBossSpawnTime = currentTime + 60; // 60 saniye = 1 dakika
            game.lastBossSpawnTime = currentTime; // Son boss spawn zamanını güncelle
        }
        
        game.bossesKilled++;

        // Boss öldükten sonra circle enemy spawn
        const availableTypes = ['normal', 'speeder', 'tank', 'splitter', 'blinker', 'summoner', 'shielder'];
        spawnCircularEnemies(12, 350, availableTypes);
    }

    game.medals.totalKills++;
    checkMedals();

    // Create sparkle effect
    createSparkleEffect(enemy.x, enemy.y);

    function calculateScoreRequirement(level) {
        if (level === 0) return 25;  // İlk level için 25
        if (level === 1) return 60;  // İkinci level için 60

        let previousDiff = 40;  // İlk iki level arası fark
        let currentRequired = 60;  // İkinci leveldeki gereksinim

        for(let i = 2; i <= level; i++) {
            previousDiff += 8;  // Her level'da 8 daha fazla artış
            currentRequired += previousDiff;
        }

        return currentRequired;
    }

    // Level atlama kontrolü
    const currentLevelRequirement = calculateScoreRequirement(game.level);
    const previousLevelRequirement = game.level === 0 ? 0 : calculateScoreRequirement(game.level - 1);
    const scoreInCurrentLevel = game.score - previousLevelRequirement;
    const scoreNeededForNextLevel = currentLevelRequirement - previousLevelRequirement;
    const progress = (scoreInCurrentLevel / scoreNeededForNextLevel) * 100;

    if (progress >= 100 && game.score !== game.lastScoreUpgrade) {
        game.lastScoreUpgrade = game.score;
        showFloatingText('🎊 LEVEL UP!', enemy.x, enemy.y, 'critical');
        showUpgradeScreen();
        game.level++;
        AudioSystem.levelUp();

        if (game.level % 10 === 0 && targetZoom > 0.8) {
            targetZoom -= 0.1;
        }
    }
}

function splitEnemy(enemy) {
    const childSize = enemy.size * 0.6;
    const childHealth = 1;
    const childSpeed = enemy.speed * 1.2;
    const splitCount = enemy.splitCount || 2; // Varsayılan olarak 2 parçaya bölünsün

    for(let i = 0; i < splitCount; i++) {
        const angle = (i / splitCount) * Math.PI * 2;
        const offsetX = Math.cos(angle) * enemy.size;
        const offsetY = Math.sin(angle) * enemy.size;

        game.enemies.push({
            x: enemy.x + offsetX,
            y: enemy.y + offsetY,
            type: 'normal',
            size: childSize,
            speed: childSpeed,
            health: childHealth,
            maxHealth: childHealth,
            damage: enemy.damage * 0.7,
            isChild: true,
            originalSpeed: childSpeed
        });
    }
}

function createWaveKey(types) {
    return types.sort().join('-');
}

function spawnCircularEnemies(count, radius, types) {
    const angleStep = (2 * Math.PI) / count;
    
    for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const x = game.player.x + Math.cos(angle) * radius;
        const y = game.player.y + Math.sin(angle) * radius;
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        const enemy = {
            x: x,
            y: y,
            type: type,
            size: ENEMY_SIZE,
            speed: enemySpeed,
            health: 1,
            maxHealth: 1,
            damage: ENEMY_DAMAGE,
            isFlashing: false,
            flashStartTime: 0,
            flashDuration: 200,
            lastTeleportTime: 0
        };
        
        // Apply type-specific modifications
        switch (type) {
            case 'splitter':
                enemy.size *= 1.2;
                enemy.speed *= 0.8;
                enemy.health = 2;
                enemy.maxHealth = 2;
                enemy.splitCount = 2;
                break;
            case 'blinker':
                enemy.size *= 0.9;
                enemy.speed *= 1.2;
                enemy.damage *= 1.2;
                enemy.teleportCooldown = 2000;
                enemy.teleportDistance = 150;
                break;
            case 'speeder':
                enemy.size *= 0.8;
                enemy.speed *= 1.5;
                enemy.damage *= 0.8;
                break;
            case 'tank':
                enemy.size *= 1.3;
                enemy.speed *= 0.7;
                enemy.damage *= 1.5;
                enemy.health = 3;
                enemy.maxHealth = 3;
                break;
            case 'summoner':
                enemy.size *= 1.2;
                enemy.speed *= 0.6;
                enemy.damage *= 1.2;
                enemy.health = 3;
                enemy.maxHealth = 3;
                enemy.summonCooldown = 5000;
                enemy.lastSummonTime = 0;
                enemy.summonCount = 1;
                enemy.summonRange = 150;
                break;
            case 'shielder':
                enemy.size *= 1.2;
                enemy.speed *= 0.7;
                enemy.damage *= 0.8;
                enemy.health = 5;
                enemy.maxHealth = 5;
                enemy.shield = true;
                enemy.shieldHealth = 3;
                enemy.shieldRegenTime = 5000;
                break;
        }
        
        game.enemies.push(enemy);
    }
}

let temporaryMaxEnemies = false;
let maxEnemiesTimeout = null;

// Düşman sağlığını seviyeye göre ölçeklendiren fonksiyon
function calculateEnemyHealth(baseHealth, level) {
    // Her seviye için %10 artış
    const healthMultiplier = 1 + (level * 0.1 );
    return Math.round(baseHealth * healthMultiplier);
}

function spawnEnemies() {
    if (currentState !== GameState.PLAYING) return;

    const MAX_ENEMIES = temporaryMaxEnemies ? 50 : 12;

    // Boss spawn kontrolü
    const currentGameTime = Math.floor(game.gameTime);
    
    // İlk boss için özel kontrol (1:20'de)
    if (currentGameTime === 80 && !game.boss && !game.lastBossSpawnTime) {
        spawnBoss();
        game.lastBossSpawnTime = currentGameTime;
        return;
    } 
    // İlk boss'tan sonraki kontrol
    else if (game.nextBossSpawnTime && currentGameTime >= game.nextBossSpawnTime && !game.boss && game.lastBossSpawnTime !== currentGameTime) {
        spawnBoss();
        game.lastBossSpawnTime = currentGameTime;
        // Bir sonraki boss için 30 saniye ekle
        game.nextBossSpawnTime = currentGameTime + 90;
        return;
    }

    let baseEnemyNum = ENEMY_BASE_NUM;
    let waveNumber = 1;
    let availableTypes = ['normal'];

    // Wave'e göre düşman güçlendirme çarpanları
    const waveMultiplier = Math.min(1 + (lastWave - 1) * 0.04, 2.5);
    const healthMultiplier = waveMultiplier;
    const speedMultiplier = 1 + (lastWave - 1) * 0.015;

    if (game.score >= 35 && game.score < 70) {
        availableTypes = ['speeder'];
        waveNumber = 2;
    }
    if (game.score >= 70 && game.score < 105) {
        availableTypes = ['tank'];
        waveNumber = 3;
    }
    if (game.score >= 105 && game.score < 140) {
        availableTypes = ['splitter'];
        waveNumber = 4;
    }
    if (game.score >= 140 && game.score < 175) {
        availableTypes = ['blinker'];
        waveNumber = 5;
    }
    if (game.score >= 175 && game.score < 210) {
        availableTypes = ['summoner'];
        waveNumber = 6;
    }
    if (game.score >= 210 && game.score < 245) {
        availableTypes = ['shielder'];
        waveNumber = 8;
    }
    if (game.score >= 245 && game.score < 280) {
        availableTypes = ['normal', 'speeder'];
        waveNumber = 9;
    }
    if (game.score >= 280 && game.score < 315) {
        availableTypes = ['normal', 'speeder', 'tank'];
        waveNumber = 10;
    }
    if (game.score >= 315 && game.score < 350) {
        availableTypes = ['normal', 'speeder', 'tank', 'splitter'];
        waveNumber = 11;
    }
    if (game.score >= 350 && game.score < 385) {
        availableTypes = ['normal', 'speeder', 'tank', 'splitter', 'blinker', 'summoner'];
        waveNumber = 12;
    }
    if (game.score >= 385 && game.score < 420) {
        availableTypes = ['normal', 'speeder', 'tank', 'splitter', 'blinker', 'summoner'];
        waveNumber = 13;
    }
    if (game.score >= 420) {
        availableTypes = ['normal', 'speeder', 'tank', 'splitter', 'blinker', 'summoner', 'shielder'];
        waveNumber = 14;
    }

    const waveKey = createWaveKey(availableTypes);

    if (waveNumber !== lastWave) {
        lastWave = waveNumber;
    }

    const numEnemies = Math.floor(baseEnemyNum * ENEMY_SPAWN_QUANTITY * 0.5);
    const distance = Math.max(canvas.width, canvas.height) / (2 * game.camera.zoom) + ENEMY_SPAWN_OFFSET;
    const pX = game.player.x;
    const pY = game.player.y;

    // Get player's last movement direction
    let spawnAngle;
    if (game.player.moveDirection && (game.player.moveDirection.dx !== 0 || game.player.moveDirection.dy !== 0)) {
        // Use actual movement direction
        spawnAngle = Math.atan2(game.player.moveDirection.dy, game.player.moveDirection.dx);
    } else {
        // If no movement, use a random angle
        spawnAngle = Math.random() * Math.PI * 2;
    }

    const spawnAngleRange = Math.PI * 0.5; // 90 degrees range

    for (let i = 0; i < numEnemies; i++) {
        setTimeout(() => {
            if (game.enemies.length >= MAX_ENEMIES) {
                return;
            }

            // Calculate spawn position based on movement direction
            const randomAngleOffset = (Math.random() - 0.5) * spawnAngleRange;
            const finalSpawnAngle = spawnAngle + randomAngleOffset;
            
            const x = pX + Math.cos(finalSpawnAngle) * distance;
            const y = pY + Math.sin(finalSpawnAngle) * distance;

            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

            let enemyConfig = {
                x: x,
                y: y,
                type: type,
                health: calculateEnemyHealth(1, game.level) * healthMultiplier,
                maxHealth: calculateEnemyHealth(1, game.level) * healthMultiplier,
                lastTeleportTime: 0,
                splitCount: 0,
                isChild: false,
                speed: enemySpeed * speedMultiplier,
                damage: ENEMY_DAMAGE,
                isFlashing: false,
                flashStartTime: 0,
                flashDuration: 200,
                size: ENEMY_SIZE
            };

            switch (type) {
                case 'splitter':
                    enemyConfig.size = ENEMY_SIZE * 1.2;
                    enemyConfig.speed = enemySpeed * 0.8 * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE;
                    enemyConfig.health = calculateEnemyHealth(2, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(2, game.level) * healthMultiplier;
                    enemyConfig.splitCount = 2;
                    break;
                case 'blinker':
                    enemyConfig.size = ENEMY_SIZE * 0.9;
                    enemyConfig.speed = enemySpeed * 1.2 * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE * 1.2;
                    enemyConfig.health = calculateEnemyHealth(1, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(1, game.level) * healthMultiplier;
                    enemyConfig.teleportCooldown = 2000;
                    enemyConfig.teleportDistance = 150;
                    break;
                case 'speeder':
                    enemyConfig.size = ENEMY_SIZE * 0.8;
                    enemyConfig.speed = enemySpeed * 1.5 * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE * 0.8;
                    enemyConfig.health = calculateEnemyHealth(1, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(1, game.level) * healthMultiplier;
                    break;
                case 'tank':
                    enemyConfig.size = ENEMY_SIZE * 1.3;
                    enemyConfig.speed = enemySpeed * 0.7 * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE * 1.5;
                    enemyConfig.health = calculateEnemyHealth(3, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(3, game.level) * healthMultiplier;
                    break;
                case 'summoner':
                    enemyConfig.size = ENEMY_SIZE * 1.2;
                    enemyConfig.speed = enemySpeed * 0.6 * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE * 1.2;
                    enemyConfig.health = calculateEnemyHealth(3, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(3, game.level) * healthMultiplier;
                    enemyConfig.summonCooldown = 5000;
                    enemyConfig.lastSummonTime = 0;
                    enemyConfig.summonCount = 1;
                    enemyConfig.summonRange = 150;
                    break;
                case 'shielder':
                    enemyConfig.size = ENEMY_SIZE * 1.2;
                    enemyConfig.speed = enemySpeed * 0.7 * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE * 0.8;
                    enemyConfig.health = calculateEnemyHealth(5, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(5, game.level) * healthMultiplier;
                    enemyConfig.shield = true;
                    enemyConfig.shieldHealth = calculateEnemyHealth(3, game.level) * healthMultiplier;
                    enemyConfig.shieldRegenTime = 5000;
                    break;
                default:
                    enemyConfig.size = ENEMY_SIZE;
                    enemyConfig.speed = enemySpeed * speedMultiplier;
                    enemyConfig.damage = ENEMY_DAMAGE;
                    enemyConfig.health = calculateEnemyHealth(1, game.level) * healthMultiplier;
                    enemyConfig.maxHealth = calculateEnemyHealth(1, game.level) * healthMultiplier;
            }

            game.enemies.push(enemyConfig);
        }, i * ENEMY_SPAWN_STAGGER_DELAY);
    }
}

function setTemporaryMaxEnemies() {
    temporaryMaxEnemies = true;
    
    // Clear existing timeout if there is one
    if (maxEnemiesTimeout) {
        clearTimeout(maxEnemiesTimeout);
    }
    
    // Reset after 5 seconds
    maxEnemiesTimeout = setTimeout(() => {
        temporaryMaxEnemies = false;
    }, 5000);
}

function spawnBoss() {
    if (game.boss) return;

    // Boss güçlendirmesi artık gameTime'a göre olacak
    const timeBasedWaveNumber = Math.floor(game.gameTime / 60);
    const bossHealth = BOSS_MAX_HEALTH * (1 + timeBasedWaveNumber * 0.5);
    const bossDamage = BOSS_DAMAGE * (1 + timeBasedWaveNumber * 0.3);
    const bossSpeed = BOSS_SPEED * (1 + timeBasedWaveNumber * 0.2);

    // Create boss alert elements
    const alertElement = document.createElement('div');
    alertElement.className = 'boss-alert';
    alertElement.textContent = '⚠️ BOSS INCOMING ⚠️';
    document.body.appendChild(alertElement);

    // Create screen flash effect
    const flashElement = document.createElement('div');
    flashElement.className = 'screen-flash';
    document.body.appendChild(flashElement);

    // Play boss alert sound
    playSound('boss', 1, 0);

    // Remove elements after animation
    setTimeout(() => {
        alertElement.remove();
        flashElement.remove();
    }, 2000);

    // Boss arena'yı oluştur
    game.bossArena = {
        x: game.player.x,
        y: game.player.y,
        radius: 500,
        active: true
    };

    // Spawn the actual boss after a delay
    setTimeout(spawnActualBoss, 2000);
}

function spawnActualBoss() {
    // HSL renk uzayında parlak renkler üretme
    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 40) + 60; // 60-100 arası
        const lightness = Math.floor(Math.random() * 30) + 40; // 40-70 arası
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    const side = Math.floor(Math.random() * 4);
    let x, y;
    const distance = Math.max(canvas.width, canvas.height) / (2 * game.camera.zoom);

    // Position calculation
    switch (side) {
        case 0: // top
            x = game.player.x + (Math.random() - 0.5) * distance * 2;
            y = game.player.y - distance;
            break;
        case 1: // right
            x = game.player.x + distance;
            y = game.player.y + (Math.random() - 0.5) * distance * 2;
            break;
        case 2: // bottom
            x = game.player.x + (Math.random() - 0.5) * distance * 2;
            y = game.player.y + distance;
            break;
        case 3: // left
            x = game.player.x - distance;
            y = game.player.y + (Math.random() - 0.5) * distance * 2;
            break;
    }

    game.boss = {
        x,
        y,
        type: 'normal',
        size: 60,
        speed: BOSS_SPEED,
        health: BOSS_MAX_HEALTH,
        damage: BOSS_DAMAGE + game.bossesKilled,
        phase: 1,
        minions: [],
        attackPattern: 'normal',
        lastAttackTime: performance.now(),
        attackInterval: 2000, // 2 seconds between special attacks
        originalSpeed: BOSS_SPEED,
        isFlashing: false,
        flashStartTime: 0,
        flashDuration: 200,
        // Renk özellikleri
        colors: {
            main: getRandomBrightColor(),
            secondary: getRandomBrightColor(),
            detail: getRandomBrightColor(),
            eye: getRandomBrightColor(),
            pupil: getRandomBrightColor()
        },
        // Efektler için özellikler
        effects: {
            pulseTime: 0,
            glowIntensity: 0,
            rotationAngle: 0,
            particleTime: 0
        },
        // Boss'un özel yetenekleri
        abilities: {
            canTeleport: Math.random() > 0.5,
            canSpawnMinions: Math.random() > 0.5,
            canShootProjectiles: Math.random() > 0.5,
            teleportCooldown: 5000,
            lastTeleportTime: 0,
            minionSpawnCooldown: 8000,
            lastMinionSpawnTime: 0,
            projectileCooldown: 3000,
            lastProjectileTime: 0
        },
        // Enrage durumu için özellikler
        enrageProperties: {
            isEnraged: false,
            enrageThreshold: 0.3, // %30 canı kaldığında enrage
            enrageDamageMultiplier: 1.5,
            enrageSpeedMultiplier: 1.3,
            enrageColorPulse: 0
        }
    };

    // Boss spawn efekti
    createBossEnrageEffect(game.boss.x, game.boss.y);
    showFloatingText('👿 BOSS!', game.boss.x, game.boss.y, 'spawn');
}

function findNearestEnemy() {
    const pX = game.player.x;
    const pY = game.player.y;

    let nearest = game.enemies.reduce((nearest, e) => {
        const dx = e.x - pX;
        const dy = e.y - pY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < nearest.distance ? {enemy: e, distance} : nearest;
    }, {enemy: null, distance: Infinity});
    if (game.boss) {
        const dx = game.boss.x - pX;
        const dy = game.boss.y - pY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearest.distance) {
            nearest = {enemy: game.boss, distance};
        }
    }
    return nearest.enemy;
}

function spawnBossCheat() {
    if (!game.boss) {
        spawnBoss();
    }
}

function spawnDoor() {
    if (!game || !game.doorArrow) {
        console.log("Game or doorArrow not initialized yet");
        return;
    }

    const baseDistance = Math.max(canvas.width, canvas.height) / (2 * game.camera.zoom) + 3500; // Reduced from 5000 to 300
    const distance = baseDistance * 1.2; // Reduced from 1.2 to 0.8 to make it even closer
    const angle = Math.random() * Math.PI * 2;

    console.log("Spawning door at distance:", distance, "angle:", angle);

    game.door = {
        x: game.player.x + Math.cos(angle) * distance,
        y: game.player.y + Math.sin(angle) * distance,
        size: 60,
        active: true,
        pulseTime: 0
    };

    game.doorArrow.visible = true;
    showToast("🚪 A mystical portal has appeared!", game.player.x, game.player.y, "spawnDoor");

    console.log("Door spawned:", game.door);
}

function updateBoss(deltaTime) {
    if (!game.boss) return;

    const boss = game.boss;

    // Boss öldüyse
    if (boss.health <= 0) {
        const lastBossX = boss.x;
        const lastBossY = boss.y;

        showFloatingText(`-${BOSS_DAMAGE}`, lastBossX, lastBossY, 'critical');
        createDeathParticles(lastBossX, lastBossY, false);

        game.score += BOSS_SCORE_BONUS;
        scoreDisplay.textContent = game.score;
        game.lastBossSpawnScore = game.score;
        game.bossesKilled++;

        dropLootChest(lastBossX, lastBossY);
        game.boss = null;
        showToast(`🏆 +${BOSS_SCORE_BONUS}`, lastBossX, lastBossY, 'updateBoss');
        return;
    }

    // State kontrolü ekleyelim
    if (currentState !== GameState.PLAYING) return;

    const pX = game.player.x;
    const pY = game.player.y;
    const dx = pX - boss.x;
    const dy = pY - boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Boss çok uzakta mı kontrol et
    const MAX_DISTANCE = 1000;
    const TELEPORT_DISTANCE = 400;

    if (distance > MAX_DISTANCE) {
        const playerAngle = game.player.direction;
        const newAngle = playerAngle + (Math.random() - 0.5) * Math.PI * 0.5;
        const newX = pX + Math.cos(newAngle) * TELEPORT_DISTANCE;
        const newY = pY + Math.sin(newAngle) * TELEPORT_DISTANCE;

        createTeleportEffect(boss.x, boss.y);
        boss.x = newX;
        boss.y = newY;
        createTeleportEffect(newX, newY);
        return;
    }

    if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        boss.x += normalizedDx * boss.speed * deltaTime * 60;
        boss.y += normalizedDy * boss.speed * deltaTime * 60;

        if (
            distance < game.player.size / 2 + boss.size / 2 &&
            !game.player.invulnerable &&
            !immortalityCheckbox.checked
        ) {
            handlePlayerHit(boss.damage);
        }
    }

    const bossHealthPercent = boss.health / BOSS_MAX_HEALTH;
    if (!boss.enraged && bossHealthPercent <= 0.5) {
        boss.enraged = true;
        boss.speed *= 0.8;
        showFloatingText("BOSS ENRAGED!", boss.x, boss.y, 'critical');
        createBossEnrageEffect(boss.x, boss.y);
    }
}

function createBossEnrageEffect(x, y) {
    for (let i = 0; i < 5; i++) {
        const particle = gameObjectPools.get('bossEnrageParticle');
        const angle = (i / 10) * Math.PI * 2;

        particle.x = x;
        particle.y = y;
        particle.speedX = Math.cos(angle) * (Math.random() * 3 + 2);
        particle.speedY = Math.sin(angle) * (Math.random() * 3 + 2);
        particle.size = Math.random() * 4 + 3;
        particle.life = 1.0;
        particle.fadeSpeed = 0.02;
        particle.active = true;

        particles.push(particle);
    }
}

const BOSS_SPAWN_SCORE = 100;
const CIRCULAR_SPAWN_SCORE = 75;
const CIRCULAR_SPAWN_COUNT = 12;
const MAX_ENEMIES = 10;

// Wave multipliers
const WAVE_MULTIPLIER_INCREMENT = 0.05;
const MAX_WAVE_MULTIPLIER = 3.0;
const SPEED_MULTIPLIER_INCREMENT = 0.02;