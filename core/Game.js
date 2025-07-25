"use strict";

/* ------------------ DOM Önbellekleme Örneği ------------------ */
// Mevcut getElementById satırlarını SİLMEDEN, ek olarak önbelleğe alıyoruz.
// Orijinal satırları da olduğu gibi tutuyoruz; böylece kodda silme yapmamış oluyoruz.
const cachedDom = {
    loadingScreen    : document.getElementById('loading-screen'),
    gameCanvas       : document.getElementById('game-canvas'),
    uiOverlay        : document.getElementById('ui-overlay'),
    settingsGear     : document.getElementById('settings-gear'),
    gameOverScreen   : document.getElementById('game-over'),
    currentLevelText : document.getElementById('current-level'),
    resurrectAdBtn   : document.getElementById('resurrect-ad-btn'),
    loadingText      : document.querySelector('#loading-screen h2'),
};

/* ------------------ SDK INIT ------------------ */
function initPokiSDK() {
    // SDK'nın yüklenip yüklenmediğini kontrol edelim
    if (typeof window.PokiSDK === 'undefined') {
        // SDK yüklenmediyse, varsayılan olarak oyunu başlatalım
        console.warn('Poki SDK not loaded, starting game in standalone mode');
        return;
    }

    // SDK yüklendiyse, başlatalım
    PokiSDK = window.PokiSDK;
    PokiSDK.init()
        .then(() => {
            console.log("Poki SDK successfully initialized");
            PokiSDK.gameLoadingStart();
            PokiSDK.gameLoadingFinished();
        })
        .catch(() => {
            console.error("Poki SDK failed to initialize");
        });
}

/* ------------------ Varlık Yükleme Zaman Aşımı ------------------ */
function loadAssetWithTimeout(loadFunction, timeoutDuration) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Asset loading timed out'));
        }, timeoutDuration);

        loadFunction()
            .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

/* ------------------ Asıl Varlık Yükleme ------------------ */
function loadAssets(callback) {
    let totalAssets = Object.keys(assets.images).length + Object.keys(assets.audio).length;
    let loadedAssetsCount = 0;
    let errorCount = 0;
    let errors = [];

    function assetLoaded(success, error) {
        if (success) {
            loadedAssetsCount++;
            const percentage = Math.floor((loadedAssetsCount / totalAssets) * 100);
            if (typeof PokiSDK !== 'undefined') {
                PokiSDK.gameLoadingProgress(percentage);
            }
        } else {
            errorCount++;
            errors.push(error);
        }
    }

    const loadImage = (key) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (event) => reject(new Error(`Failed to load image: ${key}`));
            img.src = assets.images[key];
        });
    };

    const loadAudio = (key) => {
        return new Promise((resolve, reject) => {
            fetch(assets.audio[key])
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    if (!AudioSystem.context) {
                        AudioSystem.init();
                    }
                    return AudioSystem.context.decodeAudioData(arrayBuffer);
                })
                .then(audioBuffer => {
                    AudioSystem.musicBuffer = audioBuffer;
                    resolve(audioBuffer);
                })
                .catch(error => reject(error));
        });
    };

    const imagePromises = Object.keys(assets.images).map(key =>
        loadAssetWithTimeout(() => loadImage(key), 10000)
            .then(img => {
                loadedAssets.images[key] = img;
                assetLoaded(true);
            })
            .catch(error => assetLoaded(false, error))
    );

    const audioPromises = Object.keys(assets.audio).map(key =>
        loadAssetWithTimeout(() => loadAudio(key), 10000)
            .then(audio => {
                loadedAssets.audio[key] = audio;
                assetLoaded(true);
            })
            .catch(error => assetLoaded(false, error))
    );

    Promise.all([...imagePromises, ...audioPromises])
        .then(() => {
            if (errorCount > 0) {
                console.error(`Failed to load ${errorCount} assets`);
                console.error(`Asset loading errors:\n${errors.map(e => e.stack).join('\n')}`);
                // Continue with available assets
                originalGroundPattern = loadedAssets.images.groundPattern;
                simulateLoading(callback);
            } else {
                originalGroundPattern = loadedAssets.images.groundPattern;
                simulateLoading(callback);
            }
        });
}

/* ------------------ Simüle Yükleme ------------------ */
function simulateLoading(callback) {
    // Orijinal satırları silmeden küçük bir değişiklikle caching
    const loadingText = cachedDom.loadingText;  
    // Orijinal: const loadingText = document.querySelector('#loading-screen h2');

    let progress = 0;
    const interval = setInterval(() => {
        progress += 20; // Increase by 20% every 400ms
        loadingText.textContent = `Loading... ${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            document.getElementById('loading-screen').style.display = 'none';
            // Eş anlamlı satır (silmeden):
            // cachedDom.loadingScreen.style.display = 'none';

            document.getElementById('game-canvas').style.display = 'block';
            document.getElementById('ui-overlay').style.display = 'flex';
            document.getElementById('settings-gear').style.display = 'block';
            callback();
        }
    }, 400); // Update every 400ms (5 steps * 400ms = 2000ms total)
}

/* ------------------ Oyun Döngüsü: updateGame ------------------ */
function updateGame() {
    const now = performance.now();
    let deltaTime = (now - lastTime) / 1000;
    
    // Prevent huge time jumps by capping deltaTime
    deltaTime = Math.min(deltaTime, 0.1); // Cap at 100ms
    
    lastTime = now;

    // Oyun zamanını güncelle
    if (currentState === GameState.PLAYING || currentState === GameState.INTRO || currentState === GameState.GAME_OVER) {
        game.gameTime += deltaTime;
    }

    // Fog Event kontrolü
    if (currentState === GameState.PLAYING) {
        // Event başlangıç kontrolü
        if (game.gameTime >= 30 && !FOG_EVENT.HAS_TRIGGERED && !FOG_EVENT.ACTIVE && !FOG_EVENT.START_TIME) {
            FOG_EVENT.ACTIVE = true;
            FOG_EVENT.START_TIME = now;
            FOG_EVENT.HAS_TRIGGERED = true;
            showToast("🌫️ Darkness is coming...", game.player.x, game.player.y);
            playSound('enemySpawn'); // Karanlık efekti için ses çal
        }

        // Event süre kontrolü
        if (FOG_EVENT.ACTIVE && FOG_EVENT.START_TIME) {
            const elapsedTime = now - FOG_EVENT.START_TIME;
            
            // Kalan süre uyarısı
            if (elapsedTime >= FOG_EVENT.DURATION - FOG_EVENT.WARNING_TIME && 
                elapsedTime < FOG_EVENT.DURATION - FOG_EVENT.WARNING_TIME + 1000) {
            }
        }
    }

    // Diziler null olmaması için
    if (!game.breakableObjects) game.breakableObjects = [];
    if (!game.healthPickups) game.healthPickups = [];

    // Sabit zoom değeri kullan
    game.camera.zoom = 0.8;

    if (currentState === GameState.PLAYING) {
        checkChestCollision();

        // Kırılabilir obje spawn interval kontrolü
        if (now - game.lastBreakableSpawnTime > game.breakableSpawnInterval) {
            spawnBreakableObject();
            game.lastBreakableSpawnTime = now;
        }

        // Sağlık pickup'larını filtrelemeden önce yerel değişkene alıyoruz
        let healthPickups = game.healthPickups;
        if (healthPickups) {
            game.healthPickups = healthPickups.filter(pickup => {
                if (!pickup.active) return false;
                
                pickup.pulsePhase += deltaTime * 5;
                const dx = game.player.x - pickup.x;
                const dy = game.player.y - pickup.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < pickup.collectRadius) {
                    // Heal player
                    game.player.health = Math.min(
                        getPlayerMaxHealth(),
                        game.player.health + Math.ceil(getPlayerMaxHealth() * 0.3)
                    );
                    playSound('pickup');
                    showFloatingText('❤️ +30% HP', pickup.x, pickup.y, 'heal');
                    gameObjectPools.release(pickup);
                    return false;
                }
                return true;
            });
        }

        // Büyüleri kullan
        if (game.playerUpgrades.fireball > 0) {
            castFireball();
        }
        if (game.playerUpgrades.chainLightning > 0) {
            castChainLightning();
        }
        if (game.playerUpgrades.frostbolt > 0) {
            castFrostbolt();
        }

        // Projeleri vs. güncelle
        updateFireballs(deltaTime);
        updateLightnings(deltaTime);
        updateSparkParticles(deltaTime);
        updateBulletParticles(deltaTime);
        updateFrostbolts(deltaTime);
        updateBooks(deltaTime);

        // Update burn effects
        if (game.activeBurnEffects) {
            game.activeBurnEffects = game.activeBurnEffects.filter(effect => {
                if (!effect.active) {
                    gameObjectPools.release(effect);
                    return false;
                }
                effect.update(deltaTime);
                return effect.active;
            });
        }
    }

    // Diğer update fonksiyonları
    updateTime();
    clearCanvas();
    drawObjects(deltaTime);
    updateObjects(deltaTime);
    handleCollisions();
    updateAllParticles(deltaTime);
    drawParticles();
    updateLevelProgress();

    // Süresi dolmuş yenilmezlik
    if (
        currentState !== GameState.PAUSED &&
        currentState !== GameState.UPGRADING &&
        game.player.invulnerable &&
        performance.now() >= game.invulnerabilityEndTime
    ) {
        game.player.invulnerable = false;
    }

    // Check for time-based medals
    const gameTimeInSeconds = Math.floor(game.gameTime);
    const medals = document.querySelectorAll('.medal');
    medals.forEach(medal => {
        const requiredTime = parseInt(medal.dataset.time);
        if (gameTimeInSeconds === requiredTime && !medal.classList.contains('earned')) {
            earnTimeMedal(requiredTime);
        }
    });

    // Update exp orbs using the pool
    gameObjectPools.update(deltaTime, game.player);

    animationFrameId = requestAnimationFrame(updateGame);
}

// Animasyon durumunu takip etmek için global değişken
let isMedalAnimationPlaying = false;

function earnTimeMedal(time) {
    // Eğer animasyon zaten çalışıyorsa yeni animasyon başlatma
    if (isMedalAnimationPlaying) return;

    const medalEmojis = {
        60: '🥉',  // 1 minute
        180: '🥈', // 3 minutes
        300: '🥇'  // 5 minutes
    };

    const medalTitles = {
        60: 'Bronze Survivor',
        180: 'Silver Veteran',
        300: 'Gold Master'
    };

    const medal = document.querySelector(`.medal[data-time="${time}"]`);
    if (!medal || medal.classList.contains('earned')) return;

    isMedalAnimationPlaying = true;

    // Create animation container at the center of the screen
    const container = document.createElement('div');
    container.className = 'star-animation-container';
    document.body.appendChild(container);

    // Create medal animation element
    const medalAnim = document.createElement('div');
    medalAnim.className = 'medal-animation';
    medalAnim.textContent = medalEmojis[time];
    container.appendChild(medalAnim);

    // Start scale animation
    setTimeout(() => {
        medalAnim.classList.add('scale');
    }, 100);

    // After scale animation, start move animation
    setTimeout(() => {
        const medalRect = medal.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const moveX = (medalRect.left - containerRect.left);
        const moveY = (medalRect.top - containerRect.top);
        
        medalAnim.style.setProperty('--moveX', `${moveX}px`);
        medalAnim.style.setProperty('--moveY', `${moveY}px`);
        
        medalAnim.classList.add('move');

        // Add earned class and show message after move animation
        setTimeout(() => {
            medal.classList.add('earned');
            container.remove();
            
            // Show achievement message
            showFloatingText(`🏆 ${medalTitles[time]} Earned!`, game.player.x, game.player.y - 50, 'achievement');
            
            // Play achievement sound
            playSound('medalEarned', 1, 0);

            // Animasyon bitti, yeni animasyonlara izin ver
            isMedalAnimationPlaying = false;
        }, 800);
    }, 500);
}

/* ------------------ Oyun Bitti Ekranı ------------------ */
function gameOver() {
    safePokiSDKCall('gameplayStop');
    document.getElementById('game-over').style.display = 'block';
    // DOM önbellekli satır (silmedik, sadece ekledik):
    // cachedDom.gameOverScreen.style.display = 'block';

    currentState = GameState.GAME_OVER;
    gameOverScreen.style.display = 'block';
    finalScoreDisplay.textContent = game.score;
    document.getElementById('current-level').textContent = game.level;
    settingsScreen.style.display = 'none';
    upgradeScreen.style.display = 'none';
    game.enemySpeedMultiplier = 1;
    loadedAssets.images.groundPattern = originalGroundPattern;
    upgradeSummary.innerHTML = `
        <h3>Upgrades Acquired</h3>
        <ul id="upgrades-list">
            <li>👾 Bosses Killed: ${game.bossesKilled}</li>
        </ul>
        <div class="stats-grid">
        <div class="stat-item">
            <div class="stat-value">${game.score}</div>
            <div class="stat-label">Final Score</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${game.bossesKilled}</div>
            <div class="stat-label">Bosses Defeated</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${Math.floor(game.gameTime)}s</div>
            <div class="stat-label">Survival Time</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${game.medals.totalKills}</div>
            <div class="stat-label">Enemies Slain</div>
        </div>
    </div>
    <h3>Upgrades Acquired</h3>
    <ul id="upgrades-list">
        ${Object.entries(game.playerUpgrades)
            .filter(([_, value]) => value > 1)
            .map(([key, value]) => `<li>${upgradeEmojis[key]} ${key}: ${value}</li>`)
            .join('')}
    </ul>
    <div class="game-over-buttons">
        <button id="resurrect-ad-btn" class="button">🎮 Watch Ad to Resurrect</button>
    </div>
    `;

    // Resurrect butonu için event listener
    document.getElementById('resurrect-ad-btn').addEventListener('click', () => {
        PokiSDK.rewardedBreak()
            .then((success) => {
                if (success) {
                    // Reklam başarıyla tamamlandı, oyuncuyu dirilt
                    resurrectPlayer();
                } else {
                    // Reklam gösterimi başarısız veya tamamlanmadı
                    console.log("Rewarded ad was not completed");
                }
            })
            .catch(() => {
                console.error("Error showing rewarded ad");
            });
    });
}

/* ------------------ Oyunu Başlat ------------------ */
function initGame() {
    console.log('initGame called'); // Debug log

    // Cache DOM elements
    const playBtn = document.getElementById('play-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const warriorBtn = document.getElementById('warrior-btn');
    const wizardBtn = document.getElementById('wizard-btn');
    const archerBtn = document.getElementById('archer-btn');
    const introScreen = document.getElementById('intro-screen');
    const characterSelectScreen = document.getElementById('character-select-screen');
    const loadingScreen = document.getElementById('loading-screen');

    // Debug log for elements
    console.log('playBtn:', playBtn);
    console.log('characterSelectScreen:', characterSelectScreen);

    // Set default character and selection state
    game.player.characterType = null;
    let characterSelected = false;

    // Disable start game button initially
    startGameBtn.disabled = true;
    startGameBtn.style.opacity = '0.5';
    startGameBtn.style.cursor = 'not-allowed';

    // Play button handler - Show character selection
    playBtn.addEventListener('click', function() {
        console.log('Play button clicked'); // Debug log
        introScreen.style.display = 'none';
        characterSelectScreen.style.display = 'flex';
        playSelectSound();
    });

    // Character selection handlers
    warriorBtn.addEventListener('click', () => {
        wizardBtn.classList.remove('active');
        archerBtn.classList.remove('active');
        warriorBtn.classList.add('active');
        game.player.characterType = CHARACTER_TYPES.WARRIOR;
        characterSelected = true;
        startGameBtn.disabled = false;
        startGameBtn.style.opacity = '1';
        startGameBtn.style.cursor = 'pointer';
        playSelectSound();
    });

    wizardBtn.addEventListener('click', () => {
        warriorBtn.classList.remove('active');
        archerBtn.classList.remove('active');
        wizardBtn.classList.add('active');
        game.player.characterType = CHARACTER_TYPES.WIZARD;
        characterSelected = true;
        startGameBtn.disabled = false;
        startGameBtn.style.opacity = '1';
        startGameBtn.style.cursor = 'pointer';
        playSelectSound();
    });

    archerBtn.addEventListener('click', () => {
        warriorBtn.classList.remove('active');
        wizardBtn.classList.remove('active');
        archerBtn.classList.add('active');
        game.player.characterType = CHARACTER_TYPES.ARCHER;
        characterSelected = true;
        startGameBtn.disabled = false;
        startGameBtn.style.opacity = '1';
        startGameBtn.style.cursor = 'pointer';
        playSelectSound();
    });

    // Start game button handler
    startGameBtn.addEventListener('click', () => {
        if (!characterSelected) {
            // Eğer karakter seçilmediyse, butonu devre dışı bırak ve uyarı ver
            showToast("Please select a character first!", game.player.x, game.player.y);
            return;
        }
        characterSelectScreen.style.display = 'none';
        startGame();
        playSelectSound();
    });

    // Initialize other game components (except event listeners)
    initTouchControls();
    
    // Show intro screen
    loadingScreen.style.display = 'none';
    introScreen.style.display = 'flex';
    characterSelectScreen.style.display = 'none';

    // Initialize other event listeners
    initEventListeners();
}

function startGame() {
    // Mevcut karakter tipini sakla
    const selectedCharacterType = game.player.characterType;

    safePokiSDKCall('gameplayStart');
    document.getElementById('game-over').style.display = 'none';

    AudioSystem.init();
    AudioSystem.loadBackgroundMusic().then(() => {
        AudioSystem.playBackgroundMusic();
    });

    // Fog Event'i sıfırla
    FOG_EVENT.ACTIVE = false;
    FOG_EVENT.START_TIME = null;
    FOG_EVENT.HAS_TRIGGERED = false;

    // Set initial character stats based on type
    switch (selectedCharacterType) {
        case CHARACTER_TYPES.WARRIOR:
            game.player.health = PLAYER_MAX_HEALTH * 1.2; // More HP
            game.player.speed = canvas.width * 0.003 * 0.9; // Slower
            break;
        case CHARACTER_TYPES.WIZARD:
            game.player.health = PLAYER_MAX_HEALTH * 0.8; // Less HP
            game.player.speed = canvas.width * 0.003; // Normal speed
            break;
        case CHARACTER_TYPES.ARCHER:
            game.player.health = PLAYER_MAX_HEALTH * 0.9; // Less HP
            game.player.speed = canvas.width * 0.003 * 1.1; // Faster
            break;
    }

    currentPatternNumber = 1;

    try {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        const highScore = game.highScore;
        const recordTime = game.recordTime;
        if (game.fireInterval) {
            clearInterval(game.fireInterval);
        }

        // Reset game state
        game.player.coins = 0; // Reset coins
        game.score = 0;
        game.level = 0;
        game.gameTime = 0;
        game.bossesKilled = 0;
        game.pickupsEaten = 0;
        game.lastBossSpawnScore = 0;
        
        // Update displays
        document.getElementById('score').textContent = '0';
        document.getElementById('time').textContent = '00:00';
        document.getElementById('coins').textContent = '0'; // Reset coin display
        
        // Game state'i yeniden oluştur
        game = {
            player: {
                x: canvas.width / 2,
                y: canvas.height / 2,
                size: 30,
                speed: game.player.speed,
                direction: null,
                health: game.player.health,
                invulnerable: false,
                coins: 0,
                characterType: selectedCharacterType,
                lastAuraDamageTime: 0
            },
            door: null,
            doorArrow: {
                visible: false,
                rotation: 0
            },
            keys: {
                w: false,
                a: false,
                s: false,
                d: false,
                arrowup: false,
                arrowdown: false,
                arrowleft: false,
                arrowright: false
            },
            medals: {
                earnedMedals: new Set(),
                totalKills: 0
            },
            frozenTime: null,
            enemies: [],
            particles: [],
            activeLightningParticles: [],
            bloodDrops: [],
            enemySpeedMultiplier: 1,
            pickups: [],
            activeFireballs: [],
            activeFrostbolts: [],
            bullets: [],
            score: 0,
            level: 0,
            gameTime: 0,
            highScore: highScore,
            recordTime: recordTime,
            bossesKilled: 0,
            camera: {x: 0, y: 0, zoom: 0.75},
            isMouseDown: false,
            targetX: 0,
            targetY: 0,
            lastScoreUpgrade: 0,
            playerUpgrades: {
                projectiles: 1,
                speed: 1,
                firerate: 1,
                pierce: 1,
                size: 1,
                range: 1,
                chainLightning: 0,
                fireball: 0,
                frostbolt: 0,
                books: 0,
                aura: 0,
            },
            books: [],
            chainLightningCooldown: 0,
            chainLightningInterval: 2000,
            lastChainLightningTime: 0,
            fireballCooldown: 0,
            fireballInterval: 3000,
            lastFireballTime: 0,
            frostboltCooldown: 0,
            frostboltInterval: 2500,
            lastFrostboltTime: 0,
            slowedEnemies: new Map(),
            boss: null,
            pickupsEaten: 0,
            defaultSpeed: canvas.width * 0.003,
            nextEnemySpawnTime: 0,
            fireInterval: null,
            invulnerabilityEndTime: 0,
            remainingInvulnerabilityTime: 0,
            joystickInput: null,
            bulletParticles: [],
            objectPools: new GameObjectPools(),
            breakableObjects: [],
            healthPickups: [],
            lastBreakableSpawnTime: 0,
            breakableSpawnInterval: 10000, // Her 10 saniyede bir eşya spawn et
            visibleSpawnRadius: {
                min: 150,  // Minimum görünür mesafe
                max: 400   // Maximum görünür mesafe
            },
            lastCircularSpawn: 0,
            activeAuraEffects: [],
            lastAuraDamageTime: 0
        };

        if (gameObjectPools) {
            particles.forEach(particle => {
                if (particle.active) {
                    gameObjectPools.release(particle);
                }
            });
        }
        particles = [];

        game.enemies.forEach(enemy => {
            if (enemy.active) {
                gameObjectPools.release(enemy);
            }
        });
        game.enemies = [];
        // Tüm array'leri temizle
        game.bullets = [];
        game.activeFireballs = [];
        game.activeFrostbolts = [];
        game.pickups = [];
        particles = [];
        game.books = [];

        PICKUP_UPGRADES.fireball = {
            value: 1,
            multiplier: false,
            enabled: true,
            weight: 2
        };

        PICKUP_UPGRADES.aura = {
            value: 1,
            multiplier: false,
            enabled: true,
            weight: 2
        };

        if (!upgradeEmojis.fireball) {
            upgradeEmojis.fireball = '🔥';
        }

        if (!upgradeEmojis.aura) {
            upgradeEmojis.aura = '💫';
        }

        if (isTouchDevice()) {
            initTouchControls();
        }

        lastTime = performance.now();
        currentState = GameState.PLAYING;
        introScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        upgradeScreen.style.display = 'none';
        settingsGear.style.display = 'none';
        scoreDisplay.textContent = '0';
        timeDisplay.textContent = '00:00';
        document.getElementById('current-level').textContent = '0';
        updateUpgradesList();
        resizeCanvas();

        document.getElementById('settings-gear').style.display = 'block';
        game.fireInterval = setInterval(() => {
            if (currentState === GameState.PLAYING) {
                shoot();
            }
        }, PLAYER_FIRE_INTERVAL / game.playerUpgrades.firerate);

        spawnDoor();

        // Başlangıçta bir tane breakable object
        spawnBreakableObject();

        animationFrameId = requestAnimationFrame(updateGame);

    } catch (error) {
        console.error('Error starting game:', error);
        // Try to recover by restarting
        restartGame();
    }
}

/* ------------------ Oyunu Restartla ------------------ */
function restartGame() {
    currentState = GameState.INTRO;
    introScreen.style.display = 'block';
    gameOverScreen.style.display = 'none';
    resetCheats();
}

/* ------------------ Dokunmatik Kontroller ------------------ */
function initTouchControls() {
    if (!isTouchDevice()) return;

    const joystickContainer = document.getElementById('joystick-container');
    joystickBase = document.getElementById('joystick-base');
    joystickKnob = document.getElementById('joystick-knob');
    joystickContainer.style.display = 'block';

    // Canvas'a touch event listener ekleyelim
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];

    // Joystick'i dokunulan yere taşı
    const joystickContainer = document.getElementById('joystick-container');
    baseX = touch.clientX - 60; // joystick base'in yarısı
    baseY = touch.clientY - 60;

    joystickContainer.style.left = baseX + 'px';
    joystickContainer.style.top = baseY + 'px';

    startX = touch.clientX;
    startY = touch.clientY;

    // Knob'u merkeze konumlandır
    joystickKnob.style.transform = 'translate(-50%, -50%)';

    joystickActive = true;
}

/* ------------------ Event Listeners ------------------ */
function initEventListeners() {
    const canvas = document.getElementById('game-canvas');
    const settingsGear = document.getElementById('settings-gear');
    const backBtn = document.getElementById('back-btn');
    const healthSlider = document.getElementById('health');
    const musicVolumeSlider = document.getElementById('music-volume');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const settingsScreen = document.getElementById('settings-screen');

    window.addEventListener('load', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('resize', handleMobileLayout);

    document.getElementById('restart-btn').addEventListener('click', () => {
        safePokiSDKCall('commercialBreak').then(() => {
            startGame();
        });
    });

    settingsGear.addEventListener('click', () => {
        if (settingsScreen.style.display === 'block') {
            hideSettings();
        } else if (currentState === GameState.UPGRADING) {
            return;
        } else {
            showSettings();
        }
    });
    backBtn.addEventListener('click', hideSettings);
    healthSlider.addEventListener('input', () => {
        game.player.health = parseInt(healthSlider.value);
        document.body.classList.add('yellow-text');
        if (game.player.health === 0) {
            gameOver();
        }
    });
    musicVolumeSlider.addEventListener('input', () => {
        if (loadedAssets.sounds.currentBgMusic) {
            loadedAssets.sounds.currentBgMusic.volume = parseFloat(musicVolumeSlider.value) / 100;
        }
    });
    sfxVolumeSlider.addEventListener('input', () => {
        Object.values(loadedAssets.sounds).forEach(sound => {
            if (sound !== loadedAssets.sounds.bgMusic) {
                sound.volume = parseFloat(sfxVolumeSlider.value) / 100;
            }
        });
    });
    document.addEventListener('keydown', (e) => {
        if (game.keys.hasOwnProperty(e.key.toLowerCase())) {
            game.keys[e.key.toLowerCase()] = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (game.keys.hasOwnProperty(e.key.toLowerCase())) {
            game.keys[e.key.toLowerCase()] = false;
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (settingsScreen.style.display === 'block') {
                hideSettings();
            } else if (currentState === GameState.GAME_OVER) {
                restartGame();
            } else if (currentState === GameState.UPGRADING) {
                return;
            } else {
                showSettings();
            }
        }
    });
    canvas.addEventListener('mousedown', e => {
        game.isMouseDown = true;
        updateMouseDirection(e);
    });
    canvas.addEventListener('mousemove', (e) => {
        game.targetX = e.clientX;
        game.targetY = e.clientY;
    });
    if (!game.keys) {
        game.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            arrowup: false,
            arrowdown: false,
            arrowleft: false,
            arrowright: false
        };
    }

    document.addEventListener('keydown', (e) => {
        if (game.keys && game.keys.hasOwnProperty(e.key.toLowerCase())) {
            game.keys[e.key.toLowerCase()] = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (game.keys && game.keys.hasOwnProperty(e.key.toLowerCase())) {
            game.keys[e.key.toLowerCase()] = false;
        }
    });
    canvas.addEventListener('mouseup', () => {
        game.isMouseDown = false;
        stopMovement();
    });

    // Karakter seçimi için event listener'ları ekle
    document.getElementById('warrior-btn').addEventListener('click', () => {
        document.getElementById('wizard-btn').classList.remove('active');
        document.getElementById('archer-btn').classList.remove('active');
        document.getElementById('warrior-btn').classList.add('active');
        game.player.characterType = CHARACTER_TYPES.WARRIOR;
    });

    document.getElementById('wizard-btn').addEventListener('click', () => {
        document.getElementById('warrior-btn').classList.remove('active');
        document.getElementById('archer-btn').classList.remove('active');
        document.getElementById('wizard-btn').classList.add('active');
        game.player.characterType = CHARACTER_TYPES.WIZARD;
    });

    document.getElementById('archer-btn').addEventListener('click', () => {
        document.getElementById('warrior-btn').classList.remove('active');
        document.getElementById('wizard-btn').classList.remove('active');
        document.getElementById('archer-btn').classList.add('active');
        game.player.characterType = CHARACTER_TYPES.ARCHER;
    });
}

/* ------------------ Stil Elemanı Eklenmesi (Orijinal Kod Korundu) ------------------ */
document.head.appendChild(style);

/* ------------------ Pencere ve DOMContentLoaded ------------------ */
window.addEventListener('load', initPokiSDK);

document.addEventListener('DOMContentLoaded', function () {
    loadAssets(() => {
        currentState = GameState.INTRO;
        loadingScreen.style.display = 'none';
        introScreen.style.display = 'block';
        initGame();
        initEventListeners();
        resizeCanvas();
        handleMobileLayout();
        createBloodDrops(60);
        requestAnimationFrame(updateGame);
        document.addEventListener('touchstart', enableAudio);
        document.addEventListener('click', enableAudio);
        playMusic('bgMusic').catch(error => console.error('Initial music play failed:', error));
    });
});

/* ------------------ Breakable Nesne Spawn ------------------ */
function spawnBreakableObject() {
    // Görünür bir alanda spawn etmek için viewport hesaplaması
    const viewportWidth = canvas.width / game.camera.zoom;
    const viewportHeight = canvas.height / game.camera.zoom;
    
    // Viewport sınırları içinde rastgele bir konum seç
    const minX = game.player.x - (viewportWidth / 2) + 50;  // Kenarlardan 50px içeride
    const maxX = game.player.x + (viewportWidth / 2) - 50;
    const minY = game.player.y - (viewportHeight / 2) + 50;
    const maxY = game.player.y + (viewportHeight / 2) - 50;
    
    // Rastgele konum belirle
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    
    const breakable = gameObjectPools.get('breakableObject');
    breakable.x = x;
    breakable.y = y;
    breakable.health = 1;
    breakable.active = true;
    
    // Oyuncuya çok yakın spawn olmasını engelle
    const dx = breakable.x - game.player.x;
    const dy = breakable.y - game.player.y;
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToPlayer < game.visibleSpawnRadius.min) {
        gameObjectPools.release(breakable);
        spawnBreakableObject(); // Tekrar dene
        return;
    }
    
    // Spawn efekti ekle
    showFloatingText('📦', breakable.x, breakable.y, 'spawn');
    
    game.breakableObjects.push(breakable);
}

function spawnExpOrb(x, y, value) {
    const orb = gameObjectPools.get('expOrb');
    orb.x = x;
    orb.y = y;
    orb.value = value;
    orb.speed = 0;
    orb.type = 'expOrb';
    return orb;
}
