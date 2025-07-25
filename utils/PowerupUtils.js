"use strict";

/* ========================= *
 *   FIREBALL POWERUP KODU   *
 * ========================= */
function applyTripleFireballPower() {
    // Hemen başlatmak için ilk atışı yap
    game.lastFireballTime = 0;
    game.playerUpgrades.fireball++;

    const fireballCooldown = game.fireballInterval / 6; // Atışlar arası süre
    let lastShootTime = performance.now();
    let isActive = true;

    // İlk atışı hemen yap
    multiFireball();

    // Ana güncelleme fonksiyonu
    function update() {
        if (!isActive) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - lastShootTime;

        if (deltaTime >= fireballCooldown) {
            multiFireball();
            lastShootTime = currentTime;
        }

        requestAnimationFrame(update);
    }

    // Güncellemeyi başlat
    update();

    showToast("🔥 FULL 360° FIREBALL POWER - 15 SECONDS!", game.player.x, game.player.y);

    setTimeout(() => {
        isActive = false; // Güncellemeyi durdur
        showToast("🔄 Power returns to normal", game.player.x, game.player.y);
    }, 15000);

    let timeLeft = 15;
    const powerupTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 3) {
            showToast(`⚠️ 360° Fireball ending in ${timeLeft}...`, game.player.x, game.player.y);
        }
        if (timeLeft <= 0) {
            clearInterval(powerupTimer);
        }
    }, 1000);
}

// Orijinal multiFireball fonksiyonu (silinmedi, olduğu gibi korunuyor)
function multiFireball() {
    if (currentState !== GameState.PLAYING) return;

    const speed = 4;
    const numFireballs = 5; // Kaç fireball atılacağı
    const angleIncrement = (2 * Math.PI) / numFireballs; // 360 dereceyi eşit parçalama

    // Düşman olmasa bile 360 derece ateş topu fırlatma
    for (let i = 0; i < numFireballs; i++) {
        const angle = angleIncrement * i; // Her biri eşit açıyla fırlatılır

        const fireball = gameObjectPools.get('fireball');
        fireball.x = game.player.x;
        fireball.y = game.player.y;
        fireball.dx = Math.cos(angle) * speed;
        fireball.dy = Math.sin(angle) * speed;
        fireball.radius = 15;
        fireball.damage = game.playerUpgrades.fireball * 3;
        fireball.explosionRadius = 80 + (game.playerUpgrades.fireball * 10);
        fireball.hasExploded = false;
        fireball.progress = 0;
        fireball.rotation = Math.random() * Math.PI * 2;
        fireball.rotationSpeed = (Math.random() - 0.5) * 0.2;
        fireball.active = true;

        game.activeFireballs.push(fireball);
    }

    playFireballSound();
}


/* ========================== *
 *   FROSTBOLT POWERUP KODU   *
 * ========================== */
function applyTripleFrostboltPower() {
    // Hemen başlatmak için ilk atışı yap
    game.lastFrostboltTime = 0;
    game.playerUpgrades.fireball++;

    const frostboltCooldown = game.frostboltInterval / 3; // Atışlar arası süre
    let lastShootTime = performance.now();
    let isActive = true;

    // İlk atışı hemen yap
    multiFrostbolt();

    // Ana güncelleme fonksiyonu
    function update() {
        if (!isActive) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - lastShootTime;

        if (deltaTime >= frostboltCooldown) {
            multiFrostbolt();
            lastShootTime = currentTime;
        }

        requestAnimationFrame(update);
    }

    // Güncellemeyi başlat
    update();

    showToast("❄️ FULL 360° FROSTBOLT POWER - 15 SECONDS!", game.player.x, game.player.y);

    setTimeout(() => {
        isActive = false; // Güncellemeyi durdur
        showToast("🔄 Frostbolt power returns to normal", game.player.x, game.player.y);
    }, 15000);

    let timeLeft = 15;
    const powerupTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 3) {
            showToast(`⚠️ 360° Frostbolt ending in ${timeLeft}...`, game.player.x, game.player.y);
        }
        if (timeLeft <= 0) {
            clearInterval(powerupTimer);
        }
    }, 1000);
}

// Orijinal multiFrostbolt fonksiyonu (silinmedi, olduğu gibi duruyor)
function multiFrostbolt() {
    if (currentState !== GameState.PLAYING) return;

    const speed = 3;
    const numFrostbolts = 5; // Kaç frostbolt atılacağı
    const angleIncrement = (2 * Math.PI) / numFrostbolts; // 360 dereceyi eşit parçalama

    // Düşman olmasa bile 360 derece frostbolt fırlatma
    for (let i = 0; i < numFrostbolts; i++) {
        const angle = angleIncrement * i; // Her biri eşit açıyla fırlatılır

        const frostbolt = gameObjectPools.get('frostbolt');
        frostbolt.x = game.player.x;
        frostbolt.y = game.player.y;
        frostbolt.dx = Math.cos(angle) * speed;
        frostbolt.dy = Math.sin(angle) * speed;
        frostbolt.radius = 10;
        frostbolt.damage = game.playerUpgrades.frostbolt * 2;
        frostbolt.freezeDuration = 2 + (game.playerUpgrades.frostbolt * 0.5);
        frostbolt.progress = 0;
        frostbolt.rotation = Math.random() * Math.PI * 2;
        frostbolt.rotationSpeed = (Math.random() - 0.5) * 0.1;
        frostbolt.active = true;

        game.activeFrostbolts.push(frostbolt);
    }

    playFrostboltSound();
}


/* ======================= *
 *     CHEAT RESET KODU    *
 * ======================= */
function resetCheats() {
    const immortalityCheckbox = document.getElementById('immortality');
    const autoprayCheckbox = document.getElementById('autopray');
    const healthSlider = document.getElementById('health');

    if (immortalityCheckbox) {
        immortalityCheckbox.checked = false;
    } else {
        console.error('Element with id "immortality" not found');
    }

    if (autoprayCheckbox) {
        autoprayCheckbox.checked = false;
    } else {
        console.error('Element with id "autopray" not found');
    }

    if (healthSlider) {
        healthSlider.value = healthSlider.max;
        game.player.health = parseInt(healthSlider.max);
    } else {
        console.error('Element with id "health" not found');
    }

    document.body.classList.remove('yellow-text');
}


/* ========================= *
 *  GEÇİCİ POWERUP KODLARI   *
 * ========================= */
function applyTemporaryPowerup() {
    // Mevcut değerleri sakla
    const oldFirerate = game.playerUpgrades.firerate;
    const oldProjectiles = game.playerUpgrades.projectiles;

    // Güçlendirmeleri uygula
    game.playerUpgrades.firerate = 4;
    game.playerUpgrades.projectiles = 4;

    // Ateş hızını güncelle
    clearInterval(game.fireInterval);
    game.fireInterval = setInterval(() => {
        if (currentState === GameState.PLAYING) {
            shoot();
        }
    }, PLAYER_FIRE_INTERVAL / game.playerUpgrades.firerate);

    // Ateş hızını ayarladığımız yerde ufak bir önbellekleme yapabiliriz
    // (Ama satır silmeden sadece ek yapıyoruz)
    const pFirerate = game.playerUpgrades.firerate;

    // Güçlendirme efekti
    showToast("⚡ POWER SURGE - 15 SECONDS!", game.player.x, game.player.y);

    // Timer ile güçlendirmeyi geri al
    setTimeout(() => {
        game.playerUpgrades.firerate = oldFirerate;
        game.playerUpgrades.projectiles = oldProjectiles;

        // Ateş hızını tekrar güncelle
        clearInterval(game.fireInterval);
        game.fireInterval = setInterval(() => {
            if (currentState === GameState.PLAYING) {
                shoot();
            }
        }, PLAYER_FIRE_INTERVAL / game.playerUpgrades.firerate);

        showToast("🔄 Power returns to normal", game.player.x, game.player.y);
    }, 15000);

    // Güçlendirme süresi göstergesi
    let timeLeft = 15;
    const powerupTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 3) {
            showToast(`⚠️ Power surge ending in ${timeLeft}...`, game.player.x, game.player.y);
        }
        if (timeLeft <= 0) {
            clearInterval(powerupTimer);
        }
    }, 1000);

    // Görsel efekt
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 50;
        const particle = new Particle(
            game.player.x + Math.cos(angle) * distance,
            game.player.y + Math.sin(angle) * distance,
            '#FFD700'
        );
        particle.speedX = Math.cos(angle) * 3;
        particle.speedY = Math.sin(angle) * 3;
        particles.push(particle);
    }

    // Ses efekti
    const audioContext = AudioSystem.context;
    if (audioContext) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
    }
}
