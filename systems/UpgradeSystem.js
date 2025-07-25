const upgradeDetails = {
    books: {
        title: "Orbiting Books",
        description: "Magical books orbit around you, damaging enemies they touch.",
        type: "special",
        stats: level => `Books: ${level}\nDamage: ${level * BOOK_CONFIG.baseDamage}\nSpeed: ${100 + level * 20}%`
    },
    fireball: {
        title: "Fireball",
        description: "Launch a powerful fireball that explodes on impact, dealing massive area damage.",
        type: "damage",
        stats: level => `Damage: ${level * 20}\nExplosion Radius: ${50 + level * 10}\nBurn Chance: ${20 + level * 5}%`
    },
    chainLightning: {
        title: "Chain Lightning",
        description: "Release electric bolts that jump between enemies, creating devastating chain reactions.",
        type: "damage",
        stats: level => `Damage: ${level * 15}\nJumps: ${level + 2}\nChain Range: ${100 + level * 20}`
    },
    frostbolt: {
        title: "Frostbolt",
        description: "Cast a freezing projectile that slows and damages enemies in an area of effect.",
        type: "utility",
        stats: level => `Damage: ${level * 10}\nSlow Effect: ${30 + level * 5}%\nFreeze Duration: ${2 + level * 0.5}s`
    },
    projectiles: {
        title: "Multi-Shot",
        description: "Increase the number of projectiles fired with each attack.",
        type: "damage",
        stats: level => `Projectiles: ${level + 1}\nSpread Angle: ${10 + level * 5}°\nDamage Per Shot: 100%`
    },
    firerate: {
        title: "Rapid Fire",
        description: "Increase your attack speed, unleashing a faster barrage of projectiles.",
        type: "damage",
        icon: "💨",
        stats: level => `Attack Speed: ${((level - 1) * 100).toFixed(0)}%\nCooldown Reduction: ${level * 5}%`
    },
    pierce: {
        title: "Piercing Shot",
        description: "Your projectiles pierce through multiple enemies, maintaining full damage.",
        type: "damage",
        stats: level => `Pierce Count: ${level}\nPenetration Power: ${100 + level * 20}%\nRange: ${100 + level * 10}%`
    },
    aura: {
        title: "Holy Aura",
        description: "Creates a damaging aura around you that harms nearby enemies",
        type: "damage",
        maxLevel: 5,
        weight: 2,
        icon: "💫",
        apply: (level) => {
            game.playerUpgrades.aura = level;
            return `Holy Aura Level ${level}`;
        },
        getDescription: (level) => {
            const radius = Math.round(AURA_BASE_RADIUS * (1 + (level - 1) * 0.2));
            return `Creates a ${radius}px radius aura that damages enemies every 0.5s`;
        },
        stats: level => `Aura Radius: ${Math.round(AURA_BASE_RADIUS * (1 + (level - 1) * 0.2))}px\nDamage Interval: 0.5s\nBase Damage: ${AURA_BASE_DAMAGE}`
    },
    vision: {
        title: "Night Vision",
        description: "Increase your vision range in the darkness.",
        type: "utility",
        maxLevel: 5,
        weight: 2,
        icon: "👁️",
        apply: (level) => {
            game.playerUpgrades.vision = level;
            FOG_OF_WAR.VISIBLE_RADIUS = 300 + (level * 50); // Her seviyede 50 birim artış
            return `Night Vision Level ${level}`;
        },
        getDescription: (level) => {
            return `Vision Range: ${300 + (level * 50)}px`;
        },
        stats: level => `Vision Range: ${300 + (level * 50)}px\nDarkness Penetration: ${20 + level * 10}%`
    },
};

function playStarAnimation(starElement) {
    return new Promise((resolve) => {
        // Animasyon container oluştur
        const container = document.createElement('div');
        container.className = 'star-animation-container';
        
        // Yıldız elementi oluştur
        const star = document.createElement('div');
        star.className = 'star-animation';
        container.appendChild(star);
        document.body.appendChild(container);

        // Scale animasyonunu başlat
        star.classList.add('scale');

        // Scale animasyonu bittiğinde move animasyonunu başlat
        setTimeout(() => {
            const starRect = starElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Hedef pozisyona göre hareket mesafesini hesapla
            const moveX = (starRect.left - containerRect.left) + 'px';
            const moveY = (starRect.top - containerRect.top) + 'px';

            // CSS değişkenlerini ayarla
            star.style.setProperty('--moveX', moveX);
            star.style.setProperty('--moveY', moveY);

            // Move animasyonunu başlat
            star.classList.add('move');

            // Tüm animasyonlar bittiğinde temizlik yap ve ekranı salla
            setTimeout(() => {
                container.remove();
                starElement.classList.add('earned');
                
                // Ekranı salla
                document.body.classList.add('screen-shake');
                setTimeout(() => {
                    document.body.classList.remove('screen-shake');
                }, 500);
                
                resolve();
            }, 800); // Move animasyonunun süresi
        }, 500); // Scale animasyonunun süresi
    });
}

async function updateLevelProgress() {
    if (currentState !== GameState.PLAYING) return;

    const progressBar = document.getElementById('level-progress');
    const levelText = document.getElementById('current-level');
    const coinDisplay = document.getElementById('coins');
    const currentScoreValue = game.score;
    const nextLevelRequirement = calculateScoreRequirement(game.level);
    const previousLevelRequirement = game.level === 0 ? 0 : calculateScoreRequirement(game.level - 1);

    // Level up check
    if (currentScoreValue >= nextLevelRequirement) {
        game.level++;
        
        // Award coins for leveling up
        const coinReward = calculateCoinReward(game.level);
        if (!game.player.coins) game.player.coins = 0; // Initialize if undefined
        game.player.coins = parseInt(game.player.coins) + parseInt(coinReward);
        
        // Update coin display
        if (coinDisplay) {
            coinDisplay.textContent = game.player.coins.toString();
            coinDisplay.classList.add('coin-update');
            setTimeout(() => coinDisplay.classList.remove('coin-update'), 500);
        }
        
        // Create coin particle effect
        createCoinEffect(game.player.x, game.player.y, coinReward);
        
        // Play coin sound
        playCoinSound();
        
        // Show coin reward message
        showFloatingText(`+${coinReward} 💰`, game.player.x, game.player.y - 40, 'coin');
        
        // Rest of the level up logic
        playSound('levelUp');
        showUpgradeScreen();
        currentState = GameState.UPGRADING;
    }

    // Progress calculation
    const scoreInCurrentLevel = currentScoreValue - previousLevelRequirement;
    const scoreNeededForNextLevel = nextLevelRequirement - previousLevelRequirement;
    const progress = (scoreInCurrentLevel / scoreNeededForNextLevel) * 100;
    
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    levelText.textContent = game.level;

    // Yıldız kontrolü
    const stars = document.querySelectorAll('.star');
    const starArray = Array.from(stars);

    for (const star of stars) {
        const starIndex = starArray.indexOf(star);
        const requiredScore = (starIndex + 1) * 50;
        
        if (game.score >= requiredScore && 
            !star.classList.contains('earned') && 
            !star.classList.contains('animating')
        ) {
            star.classList.add('animating');
            await playStarAnimation(star);
            playStarEarnedSound();
            showToast(`⭐ Score ${requiredScore} Star Earned!`, game.player.x, game.player.y);
            star.classList.remove('animating');
            break;
        }
    }
}

function applyPickupUpgrades(x, y) {
    const enabledUpgrades = Object.entries(PICKUP_UPGRADES)
        .filter(([_, config]) => config.enabled)
        .reduce((acc, [key, config]) => {
            for (let i = 0; i < config.weight; i++) {
                acc.push(key);
            }
            return acc;
        }, []);
    if (enabledUpgrades.length > 0) {
        const appliedUpgrades = [];
        for (let i = 0; i < 1; i++) {  // Apply up to 1 upgrade per pickup
            if (enabledUpgrades.length > 0) {
                const randomIndex = Math.floor(Math.random() * enabledUpgrades.length);
                // PERFORMANCE: bitwise short-cut (silmeden ekleme)
                // const randomIndex2 = (Math.random() * enabledUpgrades.length) | 0; 
                
                const upgrade = enabledUpgrades.splice(randomIndex, 1)[0];
                applyUpgrade(upgrade, false); // Pass false to prevent toast creation
                appliedUpgrades.push(upgrade);
            }
        }
        if (appliedUpgrades.length > 0) {
            const upgradeMessage = appliedUpgrades.map(upgrade => {
                const config = PICKUP_UPGRADES[upgrade];
                let value = config.value;
                if (config.multiplier) {
                    value = (value * 100).toFixed(0) + '%';
                }
                return `${upgradeEmojis[upgrade]} +${value}`;
            }).join(' ');
            showToast(upgradeMessage, x, y, 'applyPickupUpgrades');
        }
    }
}

function earnMedal(tier, medalData) {
    const medalScreen = document.createElement('div');
    medalScreen.className = 'medal-screen';
    medalScreen.innerHTML = `
        <div class="medal-popup ${tier}">
            <div class="medal-left">
                <div class="medal-icon">${medalData.icon}</div>
            </div>
            <div class="medal-right">
                <div class="medal-title">${medalData.title}</div>
                <div class="medal-description">${medalData.description}</div>
                <div class="medal-reward">${medalData.reward || ''}</div>
            </div>
        </div>
    `;
    document.body.appendChild(medalScreen);
    
    playMedalSound(tier);
    createMedalParticles(tier);
    
    const style = document.createElement('style');
    style.textContent = `
        .medal-screen {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            pointer-events: none;
            animation: medal-screen-in 0.5s ease-out;
        }

        .medal-popup {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            gap: 20px;
            min-width: 300px;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
        }

        .medal-left {
            flex-shrink: 0;
        }

        .medal-right {
            flex-grow: 1;
        }

        .medal-icon {
            font-size: 60px;
            animation: medal-bounce 0.5s ease-out;
        }

        .medal-title {
            color: #FFD700;
            font-size: 24px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .medal-description {
            color: #FFFFFF;
            font-size: 16px;
            margin-bottom: 8px;
        }

        .medal-reward {
            color: #00FF00;
            font-size: 18px;
            font-weight: bold;
        }

        .medal-popup.bronze {
            border: 2px solid #CD7F32;
        }

        .medal-popup.silver {
            border: 2px solid #C0C0C0;
        }

        .medal-popup.gold {
            border: 2px solid #FFD700;
        }

        @keyframes medal-screen-in {
            0% { transform: translate(-50%, -30%); opacity: 0; }
            50% { transform: translate(-50%, -55%); }
            100% { transform: translate(-50%, -50%); opacity: 1; }
        }

        @keyframes medal-bounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .fade-out {
            animation: fade-out 1s forwards;
        }

        @keyframes fade-out {
            0% { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(-50%, -100%); }
        }
    `;
    document.head.appendChild(style);
    
    if (tier === 'gold') {
        medalScreen.style.filter = 'drop-shadow(0 0 10px gold)';
    }
    
    setTimeout(() => {
        medalScreen.classList.add('fade-out');
        setTimeout(() => {
            medalScreen.remove();
            style.remove();
        }, 1000);
    }, 3000);
}

function showUpgradeScreen() {
    currentState = GameState.UPGRADING;
    const upgradeScreen = document.getElementById('upgrade-screen');
    const cardsContainer = document.getElementById('upgrade-cards-container');
    cardsContainer.innerHTML = '';
    
    // Düşmanların gücünü ve can değerlerini %3 artır
    ENEMY_DAMAGE *= 1.03;
    enemySpeed *= 1.03;
    BOSS_DAMAGE *= 1.03;
    BOSS_SPEED *= 1.03;
    BOSS_MAX_HEALTH *= 1.03;
    ENEMY_SPAWN_QUANTITY *= 1.03;
    
    // Tüm aktif düşmanların canını artır
    game.enemies.forEach(enemy => {
        enemy.maxHealth *= 1.03;
        enemy.health *= 1.03;
        if (enemy.type === 'shielder') {
            enemy.maxShieldHealth *= 1.03;
            if (enemy.shield) {
                enemy.shieldHealth *= 1.03;
            }
        }
    });
    
    // Boss'un canını artır
    if (game.boss) {
        game.boss.health *= 1.03;
    }
    
    const upgrades = Object.keys(PICKUP_UPGRADES).filter(upgrade =>
        PICKUP_UPGRADES[upgrade].enabled
    );

    const selectedUpgrades = [];
    const availableUpgrades = [...upgrades];
    
    if (game.score < 50 &&
        !game.playerUpgrades.chainLightning &&
        !game.playerUpgrades.fireball &&
        !game.playerUpgrades.frostbolt &&
        !game.playerUpgrades.books) {
        const powerUpgrade = EARLY_GAME_UPGRADES[Math.floor(Math.random() * EARLY_GAME_UPGRADES.length)];
        selectedUpgrades.push(powerUpgrade);
        const index = availableUpgrades.indexOf(powerUpgrade);
        if (index > -1) {
            availableUpgrades.splice(index, 1);
        }
        
        const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
        // PERFORMANCE: bitwise short-cut (silmeden ekleme)
        // const randomIndex2 = (Math.random() * availableUpgrades.length) | 0;
        
        selectedUpgrades.push(availableUpgrades[randomIndex]);
    } else {
        for (let i = 0; i < 2 && availableUpgrades.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            // PERFORMANCE: bitwise short-cut (silmeden ekleme)
            // const randomIndex2 = (Math.random() * availableUpgrades.length) | 0;
            
            selectedUpgrades.push(availableUpgrades.splice(randomIndex, 1)[0]);
        }
    }
    
    selectedUpgrades.forEach(upgrade => {
        const details = upgradeDetails[upgrade];
        const currentLevel = game.playerUpgrades[upgrade];

        const card = document.createElement('div');
        card.className = `upgrade-card ${details.type}`;
        card.innerHTML = `
            <div class="upgrade-icon">${upgradeEmojis[upgrade]}</div>
            <div class="upgrade-title">${details.title}</div>
            <div class="upgrade-description">${details.description}</div>
            <div class="upgrade-stats">${details.stats(currentLevel)}</div>
            <div class="upgrade-type">${details.type.toUpperCase()}</div>
            <div class="upgrade-level">
                ${'⭐'.repeat(Math.min(currentLevel, 5))}${'★'.repeat(Math.max(0, 5 - currentLevel))}
            </div>
        `;

        card.onclick = () => {
            applyUpgrade(upgrade);
            hideUpgradeScreen();
            playSelectSound();
        };

        cardsContainer.appendChild(card);
    });

    upgradeScreen.style.display = 'block';
}

function checkMedals() {
    const stats = {
        kills: game.medals.totalKills,
        boss: game.bossesKilled,
        survival: Math.floor(game.gameTime)
    };

    Object.entries(medalRequirements).forEach(([category, tiers]) => {
        Object.entries(tiers).forEach(([tier, data]) => {
            const medalId = `${category}_${tier}`;
            if (stats[category] >= data.requirement && !game.medals.earnedMedals.has(medalId)) {
                game.medals.earnedMedals.add(medalId);
                earnMedal(tier, data);
            }
        });
    });
}

function hideUpgradeScreen() {
    upgradeScreen.style.display = 'none';

    currentState = GameState.PLAYING;

    if (game.player.invulnerable) {
        document.body.classList.add('hurt');
        game.invulnerabilityEndTime = performance.now() + game.remainingInvulnerabilityTime;
    }
}

function applyUpgrade(upgrade, showToastMessage = true) {
    const upgradeConfig = PICKUP_UPGRADES[upgrade];
    let upgradeValue = upgradeConfig.value;
    if (upgradeConfig.multiplier) {
        game.playerUpgrades[upgrade] *= (1 + upgradeValue);
        upgradeValue = `${(upgradeValue * 100).toFixed(0)}%`;
    } else {
        // Chain Lightning yeteneği ilk kez alındığında özel efekt
        if (upgrade === 'chainLightning' && game.playerUpgrades[upgrade] === 0) {
            // Merkezi elektrik patlaması
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const distance = 60;
                const particle = gameObjectPools.get('chainLightningParticle');
                particle.x = game.player.x + Math.cos(angle) * distance;
                particle.y = game.player.y + Math.sin(angle) * distance;
                particle.vx = Math.cos(angle) * 4;
                particle.vy = Math.sin(angle) * 4;
                particle.size = 10;
                particle.life = 1.0;
                particle.decay = 0.03;
                particle.color = 'rgba(150, 220, 255, 0.9)';
                particle.active = true;
                game.bulletParticles.push(particle);
            }
            
            // Yıldırım çemberi
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const startAngle = (i / 8) * Math.PI * 2;
                    const endAngle = startAngle + Math.PI / 4;
                    createLightningEffect(
                        game.player.x + Math.cos(startAngle) * 40,
                        game.player.y + Math.sin(startAngle) * 40,
                        game.player.x + Math.cos(endAngle) * 40,
                        game.player.y + Math.sin(endAngle) * 40
                    );
                }, i * 100);
            }
            
            // Yukarı yükselen elektrik parçacıkları
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 80;
                    const particle = gameObjectPools.get('chainLightningParticle');
                    particle.x = game.player.x + offsetX;
                    particle.y = game.player.y;
                    particle.vx = (Math.random() - 0.5) * 2;
                    particle.vy = -5 - Math.random() * 3;
                    particle.size = 10;
                    particle.life = 1.0;
                    particle.decay = 0.03;
                    particle.color = 'rgba(180, 230, 255, 0.9)';
                    particle.active = true;
                    game.bulletParticles.push(particle);
                }, i * 50);
            }
            
            // Elektrik dalgası
            for (let i = 0; i < 360; i += 20) {
                const angle = (i * Math.PI) / 180;
                setTimeout(() => {
                    const particle = gameObjectPools.get('chainLightningParticle');
                    particle.x = game.player.x;
                    particle.y = game.player.y;
                    particle.vx = Math.cos(angle) * 6;
                    particle.vy = Math.sin(angle) * 6;
                    particle.size = 5;
                    particle.life = 0.8;
                    particle.decay = 0.05;
                    particle.color = 'rgba(100, 180, 255, 0.8)';
                    particle.active = true;
                    game.bulletParticles.push(particle);
                }, i);
            }
            
            playChainLightningSound();
        }
        // Fireball yeteneği ilk kez alındığında özel efekt
        else if (upgrade === 'fireball' && game.playerUpgrades[upgrade] === 0) {
            // Çevresel ateş efekti
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 50;
                const particle = gameObjectPools.get('fireballParticle');
                particle.x = game.player.x + Math.cos(angle) * distance;
                particle.y = game.player.y + Math.sin(angle) * distance;
                particle.vx = Math.cos(angle) * 3;
                particle.vy = Math.sin(angle) * 3;
                particle.size = 8;
                particle.life = 1.0;
                particle.decay = 0.02;
                particle.color = 'rgba(255, 140, 0, 0.9)';
                particle.active = true;
                game.bulletParticles.push(particle);
            }
            
            // Yükselen ateş spirali
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const angle = (i / 20) * Math.PI * 8;
                    const distance = 20 + i * 2;
                    const particle = gameObjectPools.get('fireballParticle');
                    particle.x = game.player.x + Math.cos(angle) * distance;
                    particle.y = game.player.y + Math.sin(angle) * distance;
                    particle.vx = Math.cos(angle) * 2;
                    particle.vy = Math.sin(angle) * 2 - 4;
                    particle.size = 6;
                    particle.life = 1.0;
                    particle.decay = 0.02;
                    particle.color = 'rgba(255, 200, 0, 0.9)';
                    particle.active = true;
                    game.bulletParticles.push(particle);
                }, i * 50);
            }
            
            playFireballSound();
        }
        // Frostbolt yeteneği ilk kez alındığında özel efekt
        else if (upgrade === 'frostbolt' && game.playerUpgrades[upgrade] === 0) {
            // Çevresel buz efekti
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 50;
                const particle = gameObjectPools.get('frostboltParticle');
                particle.x = game.player.x + Math.cos(angle) * distance;
                particle.y = game.player.y + Math.sin(angle) * distance;
                particle.vx = Math.cos(angle) * 3;
                particle.vy = Math.sin(angle) * 3;
                particle.size = 8;
                particle.life = 1.0;
                particle.decay = 0.02;
                particle.color = 'rgba(200, 240, 255, 0.9)';
                particle.active = true;
                game.bulletParticles.push(particle);
            }
            
            // Yükselen buz kristalleri
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const angle = (i / 20) * Math.PI * 8;
                    const distance = 20 + i * 2;
                    const particle = gameObjectPools.get('frostboltParticle');
                    particle.x = game.player.x + Math.cos(angle) * distance;
                    particle.y = game.player.y + Math.sin(angle) * distance;
                    particle.vx = Math.cos(angle) * 2;
                    particle.vy = Math.sin(angle) * 2 - 4;
                    particle.size = 6;
                    particle.life = 1.0;
                    particle.decay = 0.02;
                    particle.color = 'rgba(150, 220, 255, 0.9)';
                    particle.active = true;
                    game.bulletParticles.push(particle);
                }, i * 50);
            }
            
            // Buz kristalleri yağmuru
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 100;
                    const particle = gameObjectPools.get('frostboltParticle');
                    particle.x = game.player.x + offsetX;
                    particle.y = game.player.y - 100;
                    particle.vx = 0;
                    particle.vy = 5 + Math.random() * 3;
                    particle.size = 4 + Math.random() * 4;
                    particle.life = 1.0;
                    particle.decay = 0.01;
                    particle.color = 'rgba(180, 230, 255, 0.9)';
                    particle.active = true;
                    game.bulletParticles.push(particle);
                }, i * 100);
            }
            
            playFrostboltSound();
        }
        
        game.playerUpgrades[upgrade] += upgradeValue;

        if (upgrade === 'books') {
            // Yeni kitap sayısına göre book array'ini güncelle
            while (game.books.length < game.playerUpgrades.books) {
                game.books.push({
                    angle: game.books.length * (2 * Math.PI / game.playerUpgrades.books),
                    lastHitTime: {}
                });
            }
        }
    }
    if (upgrade === 'firerate') {
        clearInterval(game.fireInterval);
        game.fireInterval = setInterval(() => {
            if (currentState === GameState.PLAYING) {
                shoot();
            }
        }, PLAYER_FIRE_INTERVAL / game.playerUpgrades.firerate);
    }
    if (showToastMessage) {
        showToast(`${upgradeEmojis[upgrade]} +${upgradeValue}`, game.player.x, game.player.y, 'applyUpgrade');
    }
    updateUpgradesList();
    if (currentState === GameState.UPGRADING) {
        hideUpgradeScreen();
    }
}

function updateUpgradesList() {
    upgradeList.innerHTML = '';
    for (const [key, value] of Object.entries(game.playerUpgrades)) {
        const listItem = document.createElement('li');
        listItem.textContent = `${upgradeEmojis[key]} ${key}: ${value}`;
        upgradeList.appendChild(listItem);
    }
}
