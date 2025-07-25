function castFireball() {
    const currentTime = performance.now();
    const now = currentTime;

    if (currentState !== GameState.PLAYING ||
        now - game.lastFireballTime < game.fireballInterval) {
        return;
    }

    const baseRange = 300;
    const fireballRange = baseRange * (1 + (game.playerUpgrades.fireball - 1) * 0.2);
    const px = game.player.x;
    const py = game.player.y;

    const nearestEnemy = findNearestEnemyInRange(fireballRange);
    if (!nearestEnemy) return;

    // World space'de meteor başlangıç pozisyonunu hesapla
    const meteorHeight = 300; // Height from where meteor starts falling
    const fireball = gameObjectPools.get('fireball');
    
    // Düşmanın dünya koordinatlarını al
    const targetWorldX = nearestEnemy.x;
    const targetWorldY = nearestEnemy.y;
    
    // Meteor'un başlangıç pozisyonunu düşmanın üzerine ayarla
    fireball.x = targetWorldX;
    fireball.y = targetWorldY - meteorHeight;
    
    // Hafif rastgele sapma ekle
    const randomOffset = (Math.random() - 0.5) * 30; // +/- 15 pixels random offset
    const targetX = targetWorldX + randomOffset;
    const targetY = targetWorldY;
    
    // Düşüş açısını ve hızını hesapla
    const angle = Math.atan2(targetY - fireball.y, targetX - fireball.x);
    const speed = 8; // Biraz daha hızlı düşsün
    
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
    fireball.isMeteor = true;
    fireball.targetX = targetX;
    fireball.targetY = targetY;

    game.activeFireballs.push(fireball);
    game.lastFireballTime = now;
    playFireballSound();
}

function castChainLightning() {
    // Orijinal currentTime hesaplaması
    const currentTime = performance.now();

    // Yeni değişkenle caching
    const now = currentTime;

    if (currentState !== GameState.PLAYING ||
        now - game.lastChainLightningTime < game.chainLightningInterval) {
        return;
    }

    const baseRange = 200;
    const chainLightningRange = baseRange * (1 + (game.playerUpgrades.chainLightning - 1) * 0.2);

    // Oyuncu konumunu cache'leyelim
    const px = game.player.x;
    const py = game.player.y;

    const nearestEnemy = findNearestEnemyInRange(chainLightningRange);
    if (!nearestEnemy) return;

    let hitEnemies = new Set();
    let currentTarget = nearestEnemy;
    let damage = game.playerUpgrades.chainLightning * 2;
    let jumpsLeft = game.playerUpgrades.chainLightning;
    let lastPos = { x: px, y: py };

    createLightningEffect(
        px,
        py,
        nearestEnemy.x,
        nearestEnemy.y
    );

    while (jumpsLeft > 0 && currentTarget) {
        if (currentTarget.type === 'shielder' && currentTarget.shield) {
            // Eğer düşmanın kalkanı varsa, önce kalkan hasarını uygula
            currentTarget.shieldHealth -= damage;
            showFloatingText(`-${damage}`, currentTarget.x, currentTarget.y, 'shield');

            if (currentTarget.shieldHealth <= 0) {
                currentTarget.shield = false;
                currentTarget.lastShieldBreak = performance.now();
            }
        } else if (currentTarget.health) {
            // Kalkan yoksa, normal hasarı uygula
            currentTarget.health -= damage;

            if (currentTarget.health <= 0) {
                handleEnemyHit(currentTarget);
                game.enemies = game.enemies.filter(e => e !== currentTarget);
            }
        }

        hitEnemies.add(currentTarget);
        lastPos = { x: currentTarget.x, y: currentTarget.y };

        // Bir sonraki hedefi bul
        const nextTarget = findNextChainTargetInRange(currentTarget, hitEnemies, chainLightningRange);
        showFloatingText(`-${damage}`, currentTarget.x, currentTarget.y, 'critical');

        if (nextTarget) {
            createLightningEffect(
                currentTarget.x,
                currentTarget.y,
                nextTarget.x,
                nextTarget.y,
            );
        }

        currentTarget = nextTarget;
        jumpsLeft--;
        damage = Math.floor(damage * 0.8); // Hasar her sıçramada azalır
    }

    game.lastChainLightningTime = now;
    playChainLightningSound();
}

function createDamageEffect(x, y) {
    for (let i = 0; i < 2; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        const particle = new Particle(
            x + Math.cos(angle) * 10,
            y + Math.sin(angle) * 10,
            '#4169E1'
        );
        particle.speedX = Math.cos(angle) * speed;
        particle.speedY = Math.sin(angle) * speed;
        particles.push(particle);
    }
}

function handleCollisions() {
    if (currentState !== GameState.PLAYING) return;
    updateAura();
    
    const px = game.player.x;
    const py = game.player.y;
    const playerHitbox = game.player.size / 2;

    // Check boss collisions first
    if (game.boss) {
        const dx = px - game.boss.x;
        const dy = py - game.boss.y;
        const distSq = dx * dx + dy * dy;
        const combinedRadius = playerHitbox + game.boss.size / 2;

        if (distSq < combinedRadius * combinedRadius) {
            handlePlayerHit(game.boss.damage);
        }

        // Check fireball collisions with boss
        game.activeFireballs.forEach(fireball => {
            if (!fireball.hasExploded) {
                const fbdx = game.boss.x - fireball.x;
                const fbdy = game.boss.y - fireball.y;
                const distFireballSq = fbdx * fbdx + fbdy * fbdy;
                const hitboxMultiplier = 0.8;
                const fireballCollisionRadius = (game.boss.size * hitboxMultiplier) + fireball.radius;

                if (distFireballSq < fireballCollisionRadius * fireballCollisionRadius) {
                    // Meteor hasarı
                    const damageAmount = fireball.damage || (game.playerUpgrades.fireball * 3);
                    game.boss.health -= damageAmount;
                    showFloatingText(`-${damageAmount}`, game.boss.x, game.boss.y, 'critical');

                    // Flash effect
                    game.boss.isFlashing = true;
                    game.boss.flashStartTime = performance.now();

                    // Patlama efekti
                    fireball.hasExploded = true;
                    createExplosionEffect(fireball.x, fireball.y, fireball.explosionRadius);

                    if (game.boss.health <= 0) {
                        handleEnemyHit(game.boss);
                    }
                }
            }
        });

        // Check bullet collisions with boss
        game.bullets = game.bullets.filter(b => {
            if (b.hitEnemies.has(game.boss)) return b.lifetime > 0;

            const bdx = game.boss.x - b.x;
            const bdy = game.boss.y - b.y;
            const distBulletSq = bdx * bdx + bdy * bdy;
            const hitboxMultiplier = 0.8; // Boss hitbox multiplier
            const normalCollisionRadius = (game.boss.size * hitboxMultiplier) + b.size;

            if (distBulletSq < normalCollisionRadius * normalCollisionRadius) {
                b.hitEnemies.add(game.boss);
                const damageAmount = b.damage || 1;
                showFloatingText(`-${damageAmount}`, game.boss.x, game.boss.y, 'critical');
                b.pierceCount--; // Boss'a çarpınca pierce count azalır
                if (b.pierceCount <= 0) {
                    bulletPool.release(b);
                }
                game.boss.health -= damageAmount;

                // Flash effect
                game.boss.isFlashing = true;
                game.boss.flashStartTime = performance.now();

                if (game.boss.health <= 0) {
                    handleEnemyHit(game.boss);
                }
                return b.lifetime > 0 && b.pierceCount > 0;
            }
            return b.lifetime > 0;
        });
    }

    // Regular enemy collisions
    game.enemies = game.enemies.filter(enemy => {
        const dx = px - enemy.x;
        const dy = py - enemy.y;
        const distSq = dx * dx + dy * dy;
        const combinedRadius = playerHitbox + enemy.size / 2;

        if (distSq < combinedRadius * combinedRadius) {
            handlePlayerHit(enemy.damage);
        }

        let shouldRemove = false;
        game.bullets = game.bullets.filter(b => {
            if (shouldRemove) return b.lifetime > 0;
            if (b.hitEnemies.has(enemy)) return b.lifetime > 0;

            const bdx = enemy.x - b.x;
            const bdy = enemy.y - b.y;
            const distBulletSq = bdx * bdx + bdy * bdy;

            if (enemy.type === 'shielder' && enemy.shield && enemy.active) {
                const shieldRadius = enemy.size * 1.2;
                if (distBulletSq < (shieldRadius + b.size) * (shieldRadius + b.size)) {
                    b.hitEnemies.add(enemy);
                    showFloatingText(`-1`, enemy.x, enemy.y, 'shield');
                    enemy.shieldHealth--;

                    if (enemy.shieldHealth <= 0) {
                        enemy.shield = false;
                        enemy.lastShieldBreak = performance.now();
                        
                        // If enemy has no health, handle death
                        if (enemy.health <= 0) {
                            handleEnemyHit(enemy);
                            shouldRemove = true;
                        }
                    }
                    return b.lifetime > 0;
                }
            } else {
                // Adjust collision radius based on enemy type
                const hitboxMultiplier = 0.5;
                const normalCollisionRadius = (enemy.size * hitboxMultiplier) + b.size;
                if (distBulletSq < normalCollisionRadius * normalCollisionRadius) {
                    b.hitEnemies.add(enemy);
                    const damageAmount = 1;
                    showFloatingText(`-${damageAmount}`, enemy.x, enemy.y, 'critical');
                    enemy.health -= damageAmount;

                    // Flash efektini tetikle
                    enemy.isFlashing = true;
                    enemy.flashStartTime = performance.now();

                    if (enemy.health <= 0) {
                        handleEnemyHit(enemy);
                        shouldRemove = true;
                    }
                    return b.lifetime > 0;
                }
            }
            return b.lifetime > 0;
        });

        return !shouldRemove;
    });

    // Check breakable object collisions
    game.breakableObjects = game.breakableObjects.filter(obj => {
        if (!obj.active) return false;

        // Check bullet collisions
        game.bullets = game.bullets.filter(b => {
            const dx = obj.x - b.x;
            const dy = obj.y - b.y;
            const distSq = dx * dx + dy * dy;
            const collisionRadius = obj.size / 2 + b.size;

            if (distSq < collisionRadius * collisionRadius) {
                obj.health--;
                obj.isFlashing = true;
                obj.flashStartTime = performance.now();
                showFloatingText('-1', obj.x, obj.y, 'critical');

                if (obj.health <= 0) {
                    // Spawn health pickup
                    const pickup = gameObjectPools.get('healthPickup');
                    pickup.x = obj.x;
                    pickup.y = obj.y;
                    pickup.active = true;
                    game.healthPickups.push(pickup);

                    // 90% chance to spawn magnet
                    if (Math.random() < 0.9) {
                        const magnetPickup = gameObjectPools.get('magnetPickup');
                        magnetPickup.x = obj.x + 30; // Offset a bit from health pickup
                        magnetPickup.y = obj.y;
                        magnetPickup.active = true;
                        if (!game.magnetPickups) game.magnetPickups = [];
                        game.magnetPickups.push(magnetPickup);
                    }

                    // Create destruction effect
                    createDeathParticles(obj.x, obj.y);
                    playSound('enemyDeath');
                    gameObjectPools.release(obj);
                    return false;
                }
                return b.lifetime > 0;
            }
            return b.lifetime > 0;
        });

        return obj.active;
    });
}

function castFrostbolt() {
    // Orijinal currentTime
    const currentTime = performance.now();
    // Yeni değişkenle caching
    const now = currentTime;

    // Yetenek kullanılabilirlik kontrolü
    if (currentState !== GameState.PLAYING ||
        !game.playerUpgrades.frostbolt ||
        now - game.lastFrostboltTime < game.frostboltInterval) {
        return;
    }

    const baseRange = 300;
    const frostboltRange = baseRange * (1 + (game.playerUpgrades.frostbolt - 1) * 0.2);

    // Oyuncu konumunu cache'leyelim
    const px = game.player.x;
    const py = game.player.y;

    const nearestEnemy = findNearestEnemyInRange(frostboltRange);
    if (!nearestEnemy) return;

    const angle = Math.atan2(nearestEnemy.y - py, nearestEnemy.x - px);
    const speed = 5;

    if (!game.activeFrostbolts) {
        game.activeFrostbolts = [];
    }

    const frostbolt = {
        x: px,
        y: py,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        radius: 10,
        damage: game.playerUpgrades.frostbolt * 2,
        freezeDuration: 2 + (game.playerUpgrades.frostbolt * 0.5),
        slowAmount: 0.5,
        aoeRadius: 80 + (game.playerUpgrades.frostbolt * 10),
        hasExploded: false,
        progress: 0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        active: true
    };

    game.activeFrostbolts.push(frostbolt);
    game.lastFrostboltTime = now;
    playFrostboltSound();
}

function checkDoorCollision() {
    if (!game.door || !game.door.active) return;

    // Oyuncu konumunu cache'leyelim
    const px = game.player.x;
    const py = game.player.y;

    const dx = game.door.x - px;
    const dy = game.door.y - py;
    const distance = Math.sqrt(dx * dx + dy * dy); // Orijinal
    const distSq = dx * dx + dy * dy;             // Eklenen
    const collisionRadius = game.player.size / 2 + game.door.size / 2;

    // if (distance < collisionRadius)
    if (distSq < collisionRadius * collisionRadius) {
        if (!game.portalCount) game.portalCount = 0;
        game.portalCount++;

        const newColor = generateRandomColor();
        createVictoryPattern(currentPatternNumber, newColor)
            .then(patternImg => {
                loadedAssets.images.groundPattern = patternImg;
                drawGround();
            })
            .catch(error => console.error('Pattern creation failed:', error));

        currentPatternNumber++;

        // Portal gücünü uygula
        const portalPower = portalPowers[game.portalCount];
        if (portalPower) {
            portalPower.effect();
        }

        // Kapıyı kaldır
        game.door.active = false;
        game.doorArrow.visible = false;
        createPortalEffect(game.door.x, game.door.y);

        // Boss arena oluştur
        game.bossArena = {
            x: px,
            y: py,
            radius: 250, // Arena yarıçapı
            active: true
        };

        // Boss'u spawn et
        spawnBoss();

        // Yeni kapı spawn etme
        setTimeout(() => {
            spawnDoor();
            showToast("🚪 A new portal has appeared!", game.player.x, game.player.y);
        }, 1000);
    }
}

function checkChestCollision() {
    if (!game.lootChest || game.lootChest.collected) return;

    // Oyuncu konumunu cache'leyelim
    const px = game.player.x;
    const py = game.player.y;

    const dx = game.lootChest.x - px;
    const dy = game.lootChest.y - py;
    const distance = Math.sqrt(dx * dx + dy * dy); // Orijinal
    const distSq = dx * dx + dy * dy;             // Eklenen
    const collisionRadius = game.player.size / 2 + game.lootChest.width / 2;

    // if (distance < collisionRadius)
    if (distSq < collisionRadius * collisionRadius) {
        game.lootChest.collected = true;
        currentState = GameState.UPGRADING; // Mevcut upgrade state'ini kullanalım
        showJackpotScreen();
    }
}

function updateAura() {
    if (!game.playerUpgrades.aura || currentState !== GameState.PLAYING) return;

    const currentTime = performance.now();
    
    if (currentTime - game.lastAuraDamageTime >= AURA_DAMAGE_INTERVAL) {
        const auraRadius = AURA_BASE_RADIUS * (1 + (game.playerUpgrades.aura - 1) * 0.2);
        const auraDamage = AURA_BASE_DAMAGE * game.playerUpgrades.aura;

        const px = game.player.x;
        const py = game.player.y;

        // Silinecek düşmanları tutmak için bir dizi
        const deadEnemies = [];

        game.enemies.forEach(enemy => {
            const dx = enemy.x - px;
            const dy = enemy.y - py;
            const distSq = dx * dx + dy * dy;
            const auraSq = auraRadius * auraRadius;

            if (distSq <= auraSq) {
                if (enemy.type === 'shielder' && enemy.shield) {
                    enemy.shieldHealth = Math.max(0, enemy.shieldHealth - auraDamage);
                    showFloatingText(`-${auraDamage}`, enemy.x, enemy.y, 'shield');

                    if (enemy.shieldHealth <= 0) {
                        enemy.shield = false;
                        enemy.lastShieldBreak = performance.now();
                    }
                } else {
                    enemy.health = Math.max(0, enemy.health - auraDamage);
                    showFloatingText(`-${auraDamage}`, enemy.x, enemy.y, 'critical');

                    if (enemy.health <= 0) {
                        handleEnemyHit(enemy);
                        deadEnemies.push(enemy);
                    }
                }
            }
        });

        // Ölü düşmanları listeden çıkar
        if (deadEnemies.length > 0) {
            game.enemies = game.enemies.filter(enemy => !deadEnemies.includes(enemy));
        }

        game.lastAuraDamageTime = currentTime;
    }

    // Aura görsel efektini güncelle
    if (!game.activeAuraEffects) game.activeAuraEffects = [];
    
    if (game.activeAuraEffects.length === 0) {
        const auraEffect = gameObjectPools.get('auraEffect');
        auraEffect.active = true;
        game.activeAuraEffects.push(auraEffect);
    }

    game.activeAuraEffects.forEach(aura => {
        aura.x = game.player.x;
        aura.y = game.player.y;
        aura.radius = AURA_BASE_RADIUS * (1 + (game.playerUpgrades.aura - 1) * 0.2);
        aura.update();
    });
}

function updateFireballs(deltaTime) {
    if (!game.activeFireballs) return;

    game.activeFireballs = game.activeFireballs.filter(fireball => {
        if (!fireball.active) return false;

        if (fireball.hasExploded) {
            fireball.progress += deltaTime;
            if (fireball.progress >= 0.5) {
                gameObjectPools.release(fireball);
                return false;
            }
            return true;
        }

        // Update position
        fireball.x += fireball.dx;
        fireball.y += fireball.dy;

        // Check if fireball is too far from player
        const distanceFromPlayer = Math.sqrt(
            Math.pow(fireball.x - game.player.x, 2) +
            Math.pow(fireball.y - game.player.y, 2)
        );

        if (distanceFromPlayer > 800) {
            gameObjectPools.release(fireball);
            return false;
        }

        // Meteor için hedef noktaya ulaşma kontrolü
        if (fireball.isMeteor && fireball.targetY) {
            if (fireball.y >= fireball.targetY) {
                fireball.hasExploded = true;
                createExplosionEffect(fireball.x, fireball.y, fireball.explosionRadius);
                playSound('explosion');

                // Create burn effect
                if (!game.activeBurnEffects) {
                    game.activeBurnEffects = [];
                }

                const burnEffect = gameObjectPools.get('burnEffect');
                burnEffect.x = fireball.x;
                burnEffect.y = fireball.y;
                burnEffect.radius = fireball.explosionRadius;
                burnEffect.damage = BURN_BASE_DAMAGE * game.playerUpgrades.fireball;
                burnEffect.startTime = performance.now();
                burnEffect.lastDamageTime = burnEffect.startTime;
                burnEffect.active = true;
                game.activeBurnEffects.push(burnEffect);

                // Patlama alanındaki düşmanlara hasar ver
                game.enemies.forEach(enemy => {
                    const dx = enemy.x - fireball.x;
                    const dy = enemy.y - fireball.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < fireball.explosionRadius) {
                        const damage = Math.floor(
                            fireball.damage * (1 - distance / fireball.explosionRadius)
                        );

                        if (enemy.type === 'shielder' && enemy.shield) {
                            enemy.shieldHealth -= damage;
                            showFloatingText(`-${damage}`, enemy.x, enemy.y, 'shield');

                            if (enemy.shieldHealth <= 0) {
                                enemy.shield = false;
                                enemy.lastShieldBreak = performance.now();
                            }
                        } else {
                            enemy.health -= damage;
                            showFloatingText(`-${damage}`, enemy.x, enemy.y, 'critical');

                            if (enemy.health <= 0) {
                                handleEnemyHit(enemy);
                                game.enemies = game.enemies.filter(e => e !== enemy);
                            }
                        }
                    }
                });

                return true;
            }
        }

        // Normal çarpışma kontrolü
        let hasCollided = false;
        game.enemies.forEach(enemy => {
            if (hasCollided) return;

            const dx = enemy.x - fireball.x;
            const dy = enemy.y - fireball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size / 2 + fireball.radius) {
                hasCollided = true;

                // Handle shielded enemies
                if (enemy.type === 'shielder' && enemy.shield) {
                    enemy.shieldHealth -= fireball.damage;
                    showFloatingText(`-${fireball.damage}`, enemy.x, enemy.y, 'shield');

                    if (enemy.shieldHealth <= 0) {
                        enemy.shield = false;
                        enemy.lastShieldBreak = performance.now();
                    }
                } else {
                    enemy.health -= fireball.damage;
                    showFloatingText(`-${fireball.damage}`, enemy.x, enemy.y, 'critical');

                    if (enemy.health <= 0) {
                        handleEnemyHit(enemy);
                        game.enemies = game.enemies.filter(e => e !== enemy);
                    }
                }
            }
        });

        if (hasCollided) {
            fireball.hasExploded = true;
            createExplosionEffect(fireball.x, fireball.y, fireball.explosionRadius);
            playSound('explosion');

            // Create burn effect for direct hits too
            if (!game.activeBurnEffects) {
                game.activeBurnEffects = [];
            }

            const burnEffect = gameObjectPools.get('burnEffect');
            burnEffect.x = fireball.x;
            burnEffect.y = fireball.y;
            burnEffect.radius = fireball.explosionRadius;
            burnEffect.damage = BURN_BASE_DAMAGE * game.playerUpgrades.fireball;
            burnEffect.startTime = performance.now();
            burnEffect.lastDamageTime = burnEffect.startTime;
            burnEffect.active = true;
            game.activeBurnEffects.push(burnEffect);
        }

        return true;
    });
}
