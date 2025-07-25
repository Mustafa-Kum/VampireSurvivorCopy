// Mikro-optimizasyon için sabit ve fonksiyon kısayolları ekliyoruz
const _2PI = Math.PI * 2;
const rnd = Math.random;
const sin = Math.sin;
const cos = Math.cos;
const floor = Math.floor;

// Orijinal kod başlıyor (hiçbir satır silmeden, sadece ufak dokunuşlar yaparak)

//-------------------------------------------------------------
// Particle Class
//-------------------------------------------------------------
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        // this.size = Math.random() * 3 + 2;
        this.size = rnd() * 3 + 2; // orijinal: Math.random() * 3 + 2
        // this.speedX = (Math.random() - 0.5) * 8;
        this.speedX = (rnd() - 0.5) * 8; // orijinal: (Math.random() - 0.5) * 8
        // this.speedY = (Math.random() - 0.5) * 8;
        this.speedY = (rnd() - 0.5) * 8; // orijinal: (Math.random() - 0.5) * 8
        this.gravity = 0.1;
        this.life = 1.0;
        // this.fadeSpeed = 0.02 + Math.random() * 0.02;
        this.fadeSpeed = 0.02 + rnd() * 0.02; // orijinal: 0.02 + Math.random() * 0.02
        // this.rotation = Math.random() * Math.PI * 2;
        this.rotation = rnd() * _2PI; // orijinal: Math.random() * Math.PI * 2
        // this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.rotationSpeed = (rnd() - 0.5) * 0.2; // orijinal: (Math.random() - 0.5) * 0.2
    }

    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.fadeSpeed;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.fillStyle = this.color;

        // Yıldız şekli
        ctx.beginPath();
        for(let i = 0; i < 5; i++) {
            // const angle = (i * Math.PI * 2) / 5;
            const angle = (i * _2PI) / 5; // orijinal: (i * Math.PI * 2) / 5
            const x = cos(angle) * this.size; // orijinal: Math.cos(angle)
            const y = sin(angle) * this.size; // orijinal: Math.sin(angle)
            if(i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

//-------------------------------------------------------------
// portalPowers
//-------------------------------------------------------------
let portalPowers = {
    1: {
        name: "Power Surge",
        effect: applyTemporaryPowerup // Mevcut fonksiyon
    },
    2: {
        name: "Triple Fireball",
        effect: applyTripleFireballPower
    },
    3: {
        name: "Triple Frostbolt",
        effect: applyTripleFrostboltPower
    }
};

//-------------------------------------------------------------
// Particles array
//-------------------------------------------------------------
let particles = [];

//-------------------------------------------------------------
// createDeathParticles
//-------------------------------------------------------------
function createDeathParticles(x, y, isEnemy = true) {
    const particleCount = isEnemy ? 3 : 6; // Reduced particle count
    const baseColor = isEnemy ? '#0066ff' : '#00FF00';
    const colors = [baseColor, '#1a75ff']; // Reduced color variations

    const baseSpeed = 1.5;
    const gravityEffect = 0.02;
    const fadeSpeed = 0.005;
    const rotationSpeed = 0.05;

    // Create main splash
    if (isEnemy) {
        // Main center splash only
        const mainSplash = gameObjectPools.get('deathParticle');
        Object.assign(mainSplash, {
            x,
            y,
            color: '#0066ff',
            size: 0,
            maxSize: 25,
            scaleSpeed: 4,
            life: 1.0,
            fadeSpeed: 0.1 / 10,
            type: 'splash',
            active: true,
            // Cache sin values for performance
            sinValues: new Array(12).fill(0).map((_, i) => 
                Math.sin((i / 12) * _2PI * 3)
            ),
            update() {
                if (this.size < this.maxSize) {
                    this.size += this.scaleSpeed;
                }
                this.life -= this.fadeSpeed;
            }
        });
        particles.push(mainSplash);

        // Reduced splash drops count
        const splashCount = 6; // Reduced from 8
        const angleStep = _2PI / splashCount;
        
        for (let i = 0; i < splashCount; i++) {
            const angle = i * angleStep + (rnd() * 0.2 - 0.1); // Reduced randomness
            const distance = 15 + rnd() * 15; // Reduced range
            const splash = gameObjectPools.get('deathParticle');
            
            // Use Object.assign for better performance
            Object.assign(splash, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                color: '#0066ff',
                size: 0,
                maxSize: 4 + rnd() * 6, // Reduced size variation
                scaleSpeed: 3,
                life: 1.0,
                fadeSpeed: 0.1 / 10,
                type: 'splashDrop',
                angle,
                active: true,
                update() {
                    if (this.size < this.maxSize) {
                        this.size += this.scaleSpeed;
                    }
                    this.life -= this.fadeSpeed;
                }
            });
            particles.push(splash);
        }
    }

    // Reduced flying particles
    for (let i = 0; i < particleCount; i++) {
        const particle = gameObjectPools.get('deathParticle');
        Object.assign(particle, {
            x,
            y,
            color: colors[i % 2], // Simplified color selection
            size: rnd() * 2 + 2, // Reduced size variation
            speedX: (rnd() - 0.5) * baseSpeed,
            speedY: (rnd() - 0.5) * baseSpeed,
            gravity: gravityEffect,
            life: 1.0,
            fadeSpeed: fadeSpeed + rnd() * fadeSpeed,
            rotation: rnd() * _2PI,
            rotationSpeed: (rnd() - 0.5) * rotationSpeed,
            active: true
        });
        particles.push(particle);
    }
}

//-------------------------------------------------------------
// updateParticles
//-------------------------------------------------------------
function updateParticles() {
    // Orijinal filter yapısı korunuyor
    particles = particles.filter(particle => {
        if (!particle.active) return false;

        particle.update();

        if (particle.life <= 0) {
            gameObjectPools.release(particle);
            return false;
        }
        return true;
    });
}

//-------------------------------------------------------------
// drawParticles
//-------------------------------------------------------------
function drawParticles() {
    if (particles.length === 0) return; // Early exit if no particles

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    // Pre-calculate common gradient colors
    const splashGradientStops = [
        { offset: 0, color: '#0066ff' },
        { offset: 0.6, color: 'rgba(0, 102, 255, 0.5)' },
        { offset: 1, color: 'rgba(0, 102, 255, 0)' }
    ];

    particles.forEach(particle => {
        if (!particle?.active || !isFinite(particle.x) || !isFinite(particle.y)) return;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.globalAlpha = particle.life;

        if (particle.type === 'splash') {
            // Optimized splash drawing
            ctx.beginPath();
            const baseRadius = particle.size;
            
            // Use cached sin values for shape
            for (let i = 0; i <= 8; i++) {
                const angle = i * _2PI / 8;
                const radius = baseRadius * (1 + Math.sin(angle * 3) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Simplified gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius);
            splashGradientStops.forEach(stop => {
                gradient.addColorStop(stop.offset, stop.color);
            });
            ctx.fillStyle = gradient;
            ctx.fill();

        } else if (particle.type === 'splashDrop') {
            // Simplified splash drop drawing
            ctx.rotate(particle.angle);
            ctx.beginPath();
            const size = particle.size;
            ctx.moveTo(-size/2, 0);
            ctx.lineTo(0, -size);
            ctx.lineTo(size/2, 0);
            ctx.lineTo(0, size/3);
            ctx.closePath();
            
            // Use same gradient for all drops
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            splashGradientStops.forEach(stop => {
                gradient.addColorStop(stop.offset, stop.color);
            });
            ctx.fillStyle = gradient;
            ctx.fill();

        } else {
            // Simplified basic particle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, _2PI);
            ctx.fill();
        }

        ctx.restore();
    });

    ctx.restore();
}

//-------------------------------------------------------------
// updateAllParticles
//-------------------------------------------------------------
function updateAllParticles(deltaTime) {
    if (!particles) particles = [];
    if (!game.activeLightningParticles) game.activeLightningParticles = [];
    if (!bloodDrops) game.bloodDrops = [];

    particles = updateParticleArray(particles, deltaTime);
    game.activeLightningParticles = updateParticleArray(game.activeLightningParticles, deltaTime);
    game.bloodDrops = updateParticleArray(bloodDrops, deltaTime);
}

//-------------------------------------------------------------
// updateParticleArray
//-------------------------------------------------------------
function updateParticleArray(particleArray, deltaTime) {
    if (!particleArray) return [];

    return particleArray.filter(particle => {
        if (!particle || !particle.active) return false;

        if (typeof particle.update === 'function') {
            particle.update(deltaTime);
        }

        if (particle.life <= 0 || particle.opacity <= 0) {
            if (gameObjectPools && typeof gameObjectPools.release === 'function') {
                gameObjectPools.release(particle);
            }
            return false;
        }
        return true;
    });
}

//-------------------------------------------------------------
// drawEnergyParticles
//-------------------------------------------------------------
function drawEnergyParticles(ctx, time, baseRadius) {
    const particleCount = 5; // Reduced from 10 to 5

    for (let i = 0; i < particleCount; i++) {
        const particleAngle = (i / particleCount) * Math.PI * 2 + time;
        const particleDistance = baseRadius * (1.2 + sin(time * 3 + i) * 0.3); 
        // orijinal: Math.sin(time * 3 + i)
        const x = cos(particleAngle) * particleDistance; 
        // orijinal: Math.cos(particleAngle)
        const y = sin(particleAngle) * particleDistance;

        const size = (sin(time * 4 + i) * 0.5 + 1.5) * baseRadius * 0.15;

        const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        particleGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        particleGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.7)');
        particleGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();
    }
}

//-------------------------------------------------------------
// updateSparkParticles
//-------------------------------------------------------------
function updateSparkParticles(deltaTime) {
    sparkParticles = sparkParticles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= deltaTime * 2;
        return particle.life > 0;
    });
}

//-------------------------------------------------------------
// drawSparkParticles
//-------------------------------------------------------------
function drawSparkParticles() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    sparkParticles.forEach(particle => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

//-------------------------------------------------------------
// updateBulletParticles
//-------------------------------------------------------------
function updateBulletParticles(deltaTime) {
    if (!game.bulletParticles) return;

    game.bulletParticles = game.bulletParticles.filter(particle => {
        if (!particle.active) return false;

        particle.update(deltaTime);

        if (particle.life <= 0) {
            gameObjectPools.release(particle);
            return false;
        }
        return true;
    });
}

//-------------------------------------------------------------
// drawBulletParticles
//-------------------------------------------------------------
function drawBulletParticles() {
    if (!game.bulletParticles) return;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(game.camera.zoom, game.camera.zoom);
    ctx.translate(-game.player.x, -game.player.y);

    game.bulletParticles.forEach(particle => {
        ctx.globalAlpha = particle.life;

        if (particle.type === 'crystal') {
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);

            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                // const angle = (i / 6) * Math.PI * 2;
                const angle = (i / 6) * _2PI; // orijinal: (i / 6) * Math.PI * 2
                const x1 = cos(angle) * particle.size;
                const y1 = sin(angle) * particle.size;
                const x2 = cos(angle) * (particle.size * 0.4);
                const y2 = sin(angle) * (particle.size * 0.4);

                if (i === 0) {
                    ctx.moveTo(x1, y1);
                } else {
                    ctx.lineTo(x1, y1);
                }
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        } else if (particle.type === 'wave') {
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, 'rgba(200, 240, 255, 0)');
            gradient.addColorStop(0.5, particle.color);
            gradient.addColorStop(1, 'rgba(200, 240, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            particle.size = particle.maxSize * (1 - particle.life);
        } else {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.restore();
}

//-------------------------------------------------------------
// createParticle
//-------------------------------------------------------------
function createParticle(x, y, color) {
    const particle = gameObjectPools.get('particle');
    particle.x = x;
    particle.y = y;
    particle.color = color;
    // particle.size = Math.random() * 3 + 2;
    particle.size = rnd() * 3 + 2;
    // particle.speedX = (Math.random() - 0.5) * 8;
    particle.speedX = (rnd() - 0.5) * 8;
    // particle.speedY = (Math.random() - 0.5) * 8;
    particle.speedY = (rnd() - 0.5) * 8;
    particle.gravity = 0.1;
    particle.life = 1.0;
    // particle.fadeSpeed = 0.02 + Math.random() * 0.02;
    particle.fadeSpeed = 0.02 + rnd() * 0.02;
    // particle.rotation = Math.random() * Math.PI * 2;
    particle.rotation = rnd() * _2PI;
    // particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
    particle.rotationSpeed = (rnd() - 0.5) * 0.2;
    particle.active = true;

    // Update fonksiyonunu particle objesine ekle
    particle.update = function() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.fadeSpeed;
        this.rotation += this.rotationSpeed;
    };

    return particle;
}

//-------------------------------------------------------------
// createMedalParticles
//-------------------------------------------------------------
function createMedalParticles(tier) {
    const colors = {
        bronze: ['#CD7F32', '#8B4513', '#A0522D'],
        silver: ['#C0C0C0', '#A9A9A9', '#808080'],
        gold: ['#FFD700', '#FFA500', '#DAA520']
    };

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 3;

    for (let i = 0; i < 8; i++) { // Reduced from 15 to 8
        const color = colors[tier][floor(rnd() * 3)]; // orijinal: Math.floor(Math.random() * 3)
        const particle = new Particle(centerX, centerY, color);
        particles.push(particle);
    }
}

function createCoinEffect(x, y, amount) {
    const particleCount = Math.min(amount * 2, 10); // Scale with reward, but cap at 10 particles
    
    for (let i = 0; i < particleCount; i++) {
        const particle = gameObjectPools.get('particle');
        particle.x = x;
        particle.y = y;
        particle.color = '#FFD700'; // Gold color
        particle.size = 15;
        particle.speedX = (Math.random() - 0.5) * 4;
        particle.speedY = -Math.random() * 6 - 2; // Always move upward initially
        particle.gravity = 0.2;
        particle.life = 1.0;
        particle.fadeSpeed = 0.02;
        particle.rotation = Math.random() * Math.PI * 2;
        particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
        particle.text = '💰';
        particle.active = true;
        
        particles.push(particle);
    }
}
