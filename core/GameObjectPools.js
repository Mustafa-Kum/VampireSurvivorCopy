'use strict';

// ObjectPool sınıfı
class ObjectPool {
    constructor(createFn, initialSize = 100) {
        this.pool = [];
        this.createFn = createFn;
        // Pool'u başlangıç objeleriyle doldur
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    // Pool'dan obje al
    get() {
        // Dizi referansını yerel bir değişkende tutmak ufak bir optimizasyon sağlar
        const p = this.pool;
        // Pool boşsa yeni obje oluştur
        if (p.length === 0) {
            return this.createFn();
        }
        const obj = p.pop();
        obj.active = true;
        if (obj.hitEnemies) {
            obj.hitEnemies.clear(); // Reset hitEnemies when getting from pool
        }
        return obj;
    }

    // Objeyi pool'a geri koy
    release(obj) {
        if (obj.hitEnemies) {
            obj.hitEnemies.clear(); // Reset hitEnemies when releasing to pool
        }
        // Objeyi resetle
        this.resetObject(obj);
        this.pool.push(obj);
    }

    // Objeyi varsayılan durumuna getir
    resetObject(obj) {
        obj.active = false;
        // Diğer özellikleri sıfırla (Object.keys yerine for in kullanmak daha hızlı olabilir)
        for (const key in obj) {
            if (typeof obj[key] === 'number') {
                obj[key] = 0;
            }
        }
    }

    // GameObjectPools içindeki reset() metodunda çağrıldığı için clear metodunu ekliyoruz
    clear() {
        this.pool.length = 0;
    }
}

class ExpOrbPool {
    constructor(initialSize = 100) {
        this.pool = new Array(initialSize).fill(null).map(() => this.createExpOrb());
        this.active = new Set();
    }

    createExpOrb() {
        return {
            x: 0,
            y: 0,
            targetX: 0, 
            targetY: 0,
            value: 0,
            speed: 0,
            active: false,
            collected: false,
            magnetized: false,
            lastUpdate: 0,
            color: '#FFD700',
            size: 8,
            reset: function() {
                this.x = 0;
                this.y = 0;
                this.targetX = 0;
                this.targetY = 0;
                this.value = 0;
                this.speed = 0;
                this.active = false;
                this.collected = false;
                this.magnetized = false;
                this.lastUpdate = 0;
            }
        };
    }

    get() {
        let orb = this.pool.find(orb => !orb.active);
        if (!orb) {
            orb = this.createExpOrb();
            this.pool.push(orb);
        }
        orb.active = true;
        this.active.add(orb);
        return orb;
    }

    release(orb) {
        if (!orb) return;
        orb.reset();
        orb.active = false;
        this.active.delete(orb);
    }

    update(deltaTime, player) {
        const magnetRange = 150;
        const magnetRangeSq = magnetRange * magnetRange;
        const now = performance.now();

        for (const orb of this.active) {
            if (!orb.active || orb.collected) {
                this.release(orb);
                continue;
            }

            // Only update every 16ms (roughly 60fps)
            if (now - orb.lastUpdate < 16) continue;
            orb.lastUpdate = now;

            const dx = player.x - orb.x;
            const dy = player.y - orb.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= magnetRangeSq || orb.magnetized) {
                orb.magnetized = true;
                const angle = Math.atan2(dy, dx);
                orb.speed = Math.min(orb.speed + deltaTime * 50, 15);
                
                orb.x += Math.cos(angle) * orb.speed;
                orb.y += Math.sin(angle) * orb.speed;

                // Collection check
                if (distSq <= 400) { // 20 * 20
                    orb.collected = true;
                    player.experience += orb.value;
                    
                    // Parçacık efektlerini yarıya indiriyoruz (4 parçacık)
                    for (let i = 0; i < 4; i++) {
                        const particle = gameObjectPools.get('particle');
                        const particleAngle = (i / 4) * Math.PI * 2;
                        particle.x = orb.x;
                        particle.y = orb.y;
                        particle.speedX = Math.cos(particleAngle) * 3;
                        particle.speedY = Math.sin(particleAngle) * 3;
                        particle.color = '#FFD700';
                        particle.size = 2;
                        particle.life = 0.5;
                        particle.fadeSpeed = 0.05;
                        particle.active = true;
                        particles.push(particle);
                    }
                    
                    this.release(orb);
                }
            }
        }
    }

    clear() {
        this.active.clear();
        this.pool.forEach(orb => orb.reset());
    }
}

// Bullet pool'u oluştur
const bulletPool = new ObjectPool(() => ({
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    size: 0,
    speed: 0,
    lifetime: 0,
    pierceCount: 0,
    active: false,
    hitEnemies: new Set() // Her mermi için ayrı bir set
}));

// GameObjectPools sınıfı
class GameObjectPools {
    constructor() {
        this.pools = {
            bullet: new ObjectPool(() => ({
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                size: 0,
                speed: 0,
                lifetime: 0,
                pierceCount: 0,
                active: false,
                type: 'bullet'
            })),

            // GameObjectPools class'ına ekleyelim:
            minion: new ObjectPool(() => ({
                x: 0,
                y: 0,
                type: 'normal',
                size: ENEMY_SIZE * 0.7,
                speed: enemySpeed * 1.2,
                health: 1,
                maxHealth: 1,
                damage: ENEMY_DAMAGE * 0.5,
                isMinion: true,
                active: false
            })),

            chainLightningParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '#4169E1',
                size: 0,
                opacity: 1,
                life: 1.0,
                decay: 0.02,
                active: false,
                type: 'chainLightningParticle',
                update: function() {
                    this.opacity -= this.decay;
                    this.life -= this.decay;
                }
            })),

            bossEnrageParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '#FF0000',
                size: 0,
                speedX: 0,
                speedY: 0,
                gravity: 0.1,
                life: 1.0,
                fadeSpeed: 0.02,
                active: false,
                type: 'bossEnrageParticle',
                update: function() {
                    this.speedY += this.gravity;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= this.fadeSpeed;
                }
            })),

            teleportParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '',
                size: 0,
                speedX: 0,
                speedY: 0,
                gravity: 0.1,
                life: 1.0,
                fadeSpeed: 0.02,
                rotation: 0,
                rotationSpeed: 0,
                active: false,
                type: 'teleportParticle',
                update: function() {
                    this.speedY += this.gravity;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= this.fadeSpeed;
                    this.rotation += this.rotationSpeed;
                }
            })),

            explosionParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                radius: 0,
                maxRadius: 0,
                color: '',
                opacity: 1,
                expansionSpeed: 0,
                active: false,
                type: 'explosionParticle',
                update: function(deltaTime) {
                    this.radius += this.expansionSpeed * deltaTime;
                    this.opacity -= 0.02;
                    if (this.radius >= this.maxRadius) this.life = 0;
                }
            })),

            deathParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '',
                size: 0,
                speedX: 0,
                speedY: 0,
                gravity: 0.1,
                life: 1.0,
                fadeSpeed: 0.02,
                rotation: 0,
                rotationSpeed: 0,
                type: 'deathParticle',
                active: false,
                update: function() {
                    this.speedY += this.gravity;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= this.fadeSpeed;
                    this.rotation += this.rotationSpeed;
                }
            })),

            portalParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '#FFD700',
                size: 0,
                speedX: 0,
                speedY: 0,
                life: 1.0,
                fadeSpeed: 0.02,
                active: false,
                type: 'portalParticle',
                update: function() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= this.fadeSpeed;
                }
            })),

            bloodDrop: new ObjectPool(() => ({
                x: 0,
                y: 0,
                speed: 0,
                length: 0,
                active: false,
                type: 'bloodDrop',
                update: function() {
                    this.y += this.speed;
                    if (this.y > canvas.height) {
                        this.y = -this.length;
                        this.x = Math.random() * canvas.width;
                    }
                }
            })),

            sparkleParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 0,
                angle: 0,
                life: 1,
                color: '',
                active: false,
                type: 'sparkleParticle',
                update: function() {
                    this.life -= 0.02;
                }
            })),

            shielder: new ObjectPool(() => ({
                x: 0,
                y: 0,
                type: 'shielder',
                size: ENEMY_SIZE * 1.3,
                speed: enemySpeed * 0.7,
                health: 5,
                maxHealth: 5,
                damage: ENEMY_DAMAGE * 0.8,
                shield: true,
                shieldHealth: 3,
                maxShieldHealth: 3,
                shieldRegenTime: 5000,
                lastShieldBreak: 0,
                isFlashing: false,
                flashStartTime: 0,
                flashDuration: 200,
                active: false,
                originalSpeed: enemySpeed * 0.7,
                velocity: { x: 0, y: 0 },
                id: Math.random().toString(36).substr(2, 9)
            })),

            fireball: new ObjectPool(() => ({
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                radius: 0,
                damage: 0,
                explosionRadius: 0,
                hasExploded: false,
                progress: 0,
                particles: [],
                rotation: 0,
                rotationSpeed: 0,
                active: false,
                type: 'fireball'
            })),

            frostbolt: new ObjectPool(() => ({
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                radius: 0,
                damage: 0,
                slowDuration: 0,
                slowAmount: 0,
                aoeRadius: 0,
                hasExploded: false,
                progress: 0,
                particles: [],
                rotation: 0,
                rotationSpeed: 0,
                active: false,
                type: 'frostbolt'
            })),

            chainLightning: new ObjectPool(() => ({
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0,
                progress: 0,
                segments: [],
                alpha: 1,
                speed: 0,
                active: false,
                type: 'chainLightning'
            })),

            pickup: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 0,
                type: 'diamond',
                value: 0,
                vx: 0,
                vy: 0,
                active: false,
                magnetInitialized: false
            })),

            particle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '',
                size: 0,
                speedX: 0,
                speedY: 0,
                gravity: 0.1,
                life: 1.0,
                fadeSpeed: 0.02,
                rotation: 0,
                rotationSpeed: 0,
                type: 'particle',
                active: false,
                update: function() {
                    this.speedY += this.gravity;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= this.fadeSpeed;
                    this.rotation += this.rotationSpeed;
                }
            })),

            fireballParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                ax: 0,
                ay: 0,
                size: 0,
                originalSize: 0,
                life: 1,
                decay: 0.01,
                color: 'rgba(255, 140, 0, 0.9)',
                type: 'fireballParticle',
                glow: true,
                trail: true,
                trailLength: 8,
                trailDecay: 0.1,
                active: false,
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.vx += this.ax * deltaTime;
                    this.vy += this.ay * deltaTime;
                    this.life -= this.decay;
                }
            })),

            fireballWave: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 0,
                maxSize: 0,
                life: 1,
                decay: 0.02,
                color: 'rgba(255, 150, 0, 0.5)',
                type: 'fireballWave',
                innerGlow: true,
                pulseSpeed: 0.08,
                pulseAmplitude: 0.3,
                active: false,
                update: function() {
                    this.size = this.maxSize * (1 - this.life);
                    this.life -= this.decay;
                }
            })),

            frostboltWave: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 0,
                maxSize: 0,
                life: 1,
                decay: 0.02,
                color: 'rgba(224, 247, 255, 0.5)',
                active: false,
                type: 'frostboltWave',
                update: function() {
                    this.size = this.maxSize * (1 - this.life);
                    this.life -= this.decay;
                }
            })),

            frostboltParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                ax: 0,
                ay: 0,
                size: 0,
                originalSize: 0,
                life: 1,
                decay: 0.01,
                color: 'rgba(224, 247, 255, 0.9)',
                type: 'frostboltParticle',
                glow: true,
                active: false,
                update: function (deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.vx += this.ax * deltaTime;
                    this.vy += this.ay * deltaTime;
                    this.life -= this.decay;
                }
            })),

            basicParticle: new ObjectPool(() => ({
                x: 0,
                y: 0,
                color: '',
                size: 0,
                speedX: 0,
                speedY: 0,
                gravity: 0.1,
                life: 1.0,
                fadeSpeed: 0.02,
                rotation: 0,
                rotationSpeed: 0,
                type: 'basicParticle',
                active: false,
                update: function() {
                    this.speedY += this.gravity;
                    this.x += this.speedX;
                    this.y += this.speedY;
                    this.life -= this.fadeSpeed;
                    this.rotation += this.rotationSpeed;
                }
            })),

            floatingText: new ObjectPool(() => ({
                x: 0,
                y: 0,
                text: '',
                style: 'normal',
                lifetime: 1.0,
                active: false,
                type: 'floatingText'
            })),

            book: new ObjectPool(() => ({
                angle: 0,
                lastHitTime: {},
                active: false,
                type: 'book'
            })),

            breakableObject: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 30,
                health: 3,
                type: 'breakableObject',
                active: false,
                isFlashing: false,
                flashStartTime: 0,
                flashDuration: 200
            })),

            healthPickup: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 20,
                type: 'healthPickup',
                active: false,
                collectRadius: 40,
                pulsePhase: 0
            })),

            magnetPickup: new ObjectPool(() => ({
                x: 0,
                y: 0,
                size: 20,
                type: 'magnetPickup',
                active: false,
                collectRadius: 40,
                pulsePhase: 0
            })),

            auraEffect: new ObjectPool(() => ({
                x: 0,
                y: 0,
                radius: AURA_BASE_RADIUS,
                opacity: 0.3,
                color: '#4B0082',
                active: false,
                type: 'auraEffect',
                update: function(deltaTime) {
                    // Aura efekti güncellemesi
                    this.opacity = 0.3 + Math.sin(performance.now() / 500) * 0.1;
                }
            })),

            burnEffect: new ObjectPool(() => ({
                x: 0,
                y: 0,
                radius: 0,
                damage: 0,
                startTime: 0,
                lastDamageTime: 0,
                active: false,
                type: 'burnEffect',
                update: function(deltaTime) {
                    const now = performance.now();
                    
                    // Check duration
                    if (now - this.startTime >= BURN_DURATION) {
                        this.active = false;
                        return;
                    }

                    // Apply damage to enemies in range
                    if (now - this.lastDamageTime >= BURN_DAMAGE_INTERVAL) {
                        game.enemies.forEach(enemy => {
                            const dx = enemy.x - this.x;
                            const dy = enemy.y - this.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance <= this.radius) {
                                if (enemy.type === 'shielder' && enemy.shield) {
                                    enemy.shieldHealth -= this.damage;
                                    showFloatingText(`-${this.damage}🔥`, enemy.x, enemy.y, 'shield');

                                    if (enemy.shieldHealth <= 0) {
                                        enemy.shield = false;
                                        enemy.lastShieldBreak = now;
                                    }
                                } else {
                                    enemy.health -= this.damage;
                                    showFloatingText(`-${this.damage}🔥`, enemy.x, enemy.y, 'burn');

                                    if (enemy.health <= 0) {
                                        handleEnemyHit(enemy);
                                        game.enemies = game.enemies.filter(e => e !== enemy);
                                    }
                                }
                            }
                        });
                        this.lastDamageTime = now;
                    }
                }
            }))
        };
        this.expOrbPool = new ExpOrbPool(100);
    }

    get(type) {
        if (type === 'expOrb') {
            return this.expOrbPool.get();
        }
        // Daha az property erişimi için yerel değişkende saklayabiliriz
        const pool = this.pools[type];
        return pool.get();
    }

    release(obj) {
        if (obj.type === 'expOrb') {
            this.expOrbPool.release(obj);
            return;
        }
        if (obj && obj.type && this.pools[obj.type]) {
            this.pools[obj.type].release(obj);
        }
    }

    reset() {
        this.expOrbPool.clear();
        // Tüm havuzları sıfırlamak için clear() çağrılır
        Object.values(this.pools).forEach(pool => {
            pool.clear();
        });
    }

    update(deltaTime, player) {
        this.expOrbPool.update(deltaTime, player);
        // ... rest of update logic if any ...
    }
}

// Global pool manager oluştur
let gameObjectPools = new GameObjectPools();
