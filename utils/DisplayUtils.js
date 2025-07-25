function updateFireballs(deltaTime) {
    const fireballsUpdateTime = performance.now();

    game.activeFireballs = game.activeFireballs.filter(fireball => {
        if (!fireball.active) return false;

        const distanceFromPlayer = Math.sqrt(
            Math.pow(fireball.x - game.player.x, 2) +
            Math.pow(fireball.y - game.player.y, 2)
        );

        if (distanceFromPlayer > 800) { // Maximum travel distance
            gameObjectPools.release(fireball);
            return false;
        }

        if (fireball.hasExploded) {
            fireball.progress += deltaTime;
            if (fireball.progress >= 0.5) {
                gameObjectPools.release(fireball);
                return false;
            }
            return true;
        }

        if (fireball.isOrbiting) {
            // Update orbit time
            fireball.orbitTime += deltaTime;
            
            // Update orbit angle
            fireball.orbitAngle += fireball.orbitSpeed * deltaTime;
            
            // Calculate new position based on orbit
            fireball.x = game.player.x + Math.cos(fireball.orbitAngle) * fireball.orbitRadius;
            fireball.y = game.player.y + Math.sin(fireball.orbitAngle) * fireball.orbitRadius;
            
            // Check if orbit duration is complete
            if (fireball.orbitTime >= fireball.orbitDuration) {
                fireball.isOrbiting = false;
                // Set direction towards target
                fireball.dx = Math.cos(fireball.targetAngle) * 4;
                fireball.dy = Math.sin(fireball.targetAngle) * 4;
            }
        } else {
            fireball.x += fireball.dx;
            fireball.y += fireball.dy;
        }

        fireball.rotation += fireball.rotationSpeed;

        let hasCollided = false;

        // Boss collision check
        if (game.boss) {
            const dx = game.boss.x - fireball.x;
            const dy = game.boss.y - fireball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < game.boss.size / 2 + fireball.radius) {
                hasCollided = true;
                game.boss.health -= fireball.damage;
            }
        }

        game.enemies.forEach(enemy => {
            const dx = enemy.x - fireball.x;
            const dy = enemy.y - fireball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size / 2 + fireball.radius) {
                hasCollided = true;

                // Check for shielded enemies
                if (enemy.type === 'shielder' && enemy.shield) {
                    const shieldRadius = enemy.size * 1.2;
                    if (distance < shieldRadius + fireball.radius) {
                        enemy.shieldHealth -= fireball.damage;
                        showFloatingText(`-${fireball.damage}`, enemy.x, enemy.y, 'shield');

                        if (enemy.shieldHealth <= 0) {
                            enemy.shield = false;
                            // Orijinal satırı koruyoruz
                            enemy.lastShieldBreak = performance.now();
                            // Tekrardan aynı değeri atayarak (kod silmeden) optimize çağrı
                            const shieldBreakCache = fireballsUpdateTime;
                            enemy.lastShieldBreak = shieldBreakCache;
                        }
                    }
                } else if (!enemy.shield) {
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
            // Explosion damage
            if (game.boss) {
                const dx = game.boss.x - fireball.x;
                const dy = game.boss.y - fireball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < fireball.explosionRadius) {
                    const damage = Math.floor(
                        fireball.damage * (1 - distance / fireball.explosionRadius)
                    );
                    showFloatingText(`-${damage}`, game.boss.x, game.boss.y, 'critical');
                    game.boss.health -= damage;
                }
            }

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
                            
                            // Check if enemy dies after shield break
                            if (enemy.health <= 0) {
                                handleEnemyHit(enemy);
                                game.enemies = game.enemies.filter(e => e !== enemy);
                            }
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

            fireball.hasExploded = true;
            createExplosionEffect(fireball.x, fireball.y, fireball.explosionRadius);
        }

        return true;
    });
}

function updateLightnings(deltaTime) {
    activeLightnings = activeLightnings.filter(lightning => {
        lightning.progress += lightning.speed * deltaTime;

        if (lightning.progress >= 1) {
            lightning.alpha -= deltaTime * 2;
        }

        return lightning.alpha > 0;
    });
}

function updatePickups() {
    const MAGNET_RANGE = game.player.magnetRange || 150;
    const IDEAL_DISTANCE = 200;
    const CURVE_INTENSITY = 0.8;
    const MOVEMENT_SPEED = 0.02;

    // Update magnet pickups
    if (game.magnetPickups) {
        game.magnetPickups = game.magnetPickups.filter(pickup => {
            if (!pickup.active) return false;

            const dx = game.player.x - pickup.x;
            const dy = game.player.y - pickup.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < game.player.size / 2 + pickup.collectRadius) {
                // Collect magnet
                game.player.magnetRange = 5000;
                showFloatingText('🧲 Magnet Power!', game.player.x, game.player.y, 'critical');
                playSound('pickup', 1, 0);

                // Reset magnet range after 10 seconds
                setTimeout(() => {
                    game.player.magnetRange = 150;
                    showFloatingText('🧲 Magnet Ended', game.player.x, game.player.y);
                }, 10000);

                gameObjectPools.release(pickup);
                return false;
            }

            // Move towards player if in range
            if (distance < MAGNET_RANGE) {
                pickup.x += dx * MOVEMENT_SPEED;
                pickup.y += dy * MOVEMENT_SPEED;
            }

            return true;
        });
    }

    game.pickups = game.pickups.filter(pickup => {
        if (!pickup.active) return false;

        const dx = game.player.x - pickup.x;
        const dy = game.player.y - pickup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (pickup.type === 'diamond') {
            // İlk spawn olduğunda hedef pozisyonu hesapla
            if (!pickup.hasPositioned && game.door && game.door.active) {
                const doorVector = {
                    x: game.door.x - game.player.x,
                    y: game.door.y - game.player.y
                };
                const doorDistance = Math.sqrt(doorVector.x * doorVector.x + doorVector.y * doorVector.y);

                const normalizedDoorVector = {
                    x: doorVector.x / doorDistance,
                    y: doorVector.y / doorDistance
                };

                // Hedef pozisyonu kaydet
                pickup.targetX = game.player.x + normalizedDoorVector.x * IDEAL_DISTANCE + (Math.random() - 0.5) * 50;
                pickup.targetY = game.player.y + normalizedDoorVector.y * IDEAL_DISTANCE + (Math.random() - 0.5) * 50;
                pickup.hasPositioned = true;
                pickup.moveProgress = 0;
            }

            // Hedef pozisyona smooth hareket
            if (pickup.hasPositioned && pickup.moveProgress < 1) {
                pickup.moveProgress += MOVEMENT_SPEED;
                if (pickup.moveProgress > 1) pickup.moveProgress = 1;

                // Easing function (cubic easing out)
                const ease = 1 - Math.pow(1 - pickup.moveProgress, 3);

                // Başlangıç pozisyonundan hedef pozisyona yumuşak geçiş
                pickup.x = pickup.spawnX + (pickup.targetX - pickup.spawnX) * ease;
                pickup.y = pickup.spawnY + (pickup.targetY - pickup.spawnY) * ease;
            }

            // Manyetik çekim
            if (distance < MAGNET_RANGE) {
                if (!pickup.magnetInitialized) {
                    pickup.magnetInitialized = true;
                    pickup.startX = pickup.x;
                    pickup.startY = pickup.y;
                    pickup.progress = 0;

                    const perpX = -dy;
                    const perpY = dx;
                    const normalized = Math.sqrt(perpX * perpX + perpY * perpY);
                    const randomSign = Math.random() > 0.5 ? 1 : -1;
                    pickup.controlX =
                        (pickup.x + game.player.x) / 2 +
                        (perpX / normalized) * distance * CURVE_INTENSITY * randomSign;
                    pickup.controlY =
                        (pickup.y + game.player.y) / 2 +
                        (perpY / normalized) * distance * CURVE_INTENSITY * randomSign;
                }

                const speedMultiplier = 1 - distance / MAGNET_RANGE;
                const speed = 0.5 + 2 * speedMultiplier;

                pickup.progress += speed * 0.01;
                pickup.progress = Math.min(pickup.progress, 1);

                const t = pickup.progress;
                const u = 1 - t;
                pickup.x = u * u * pickup.startX + 2 * u * t * pickup.controlX + t * t * game.player.x;
                pickup.y = u * u * pickup.startY + 2 * u * t * pickup.controlY + t * t * game.player.y;
            }
        }

        if (distance < game.player.size / 2 + pickup.size) {
            const screenX = canvas.width / 2 + (pickup.x - game.player.x) * game.camera.zoom;
            const screenY = canvas.height / 2 + (pickup.y - game.player.y) * game.camera.zoom;

            if (pickup.type === 'diamond') {
                createSparkles(screenX, screenY, '#4169E1', 3);
                game.score += pickup.value;
                scoreDisplay.textContent = game.score;
                checkScoreThresholds(game.score);
                playSound('pickup', 1, 0);
            } else {
                game.player.health = Math.min(
                    game.player.health + PICKUP_HEAL,
                    getPlayerMaxHealth()
                );
                playSound('pickup', 1, 0);
                game.pickupsEaten++;
                applyPickupUpgrades(pickup.x, pickup.y);
            }

            gameObjectPools.release(pickup);
            return false;
        }
        return true;
    });
}

function updateBooks(deltaTime) {
    if (currentState !== GameState.PLAYING) return;

    if (!game.bookState) {
        game.bookState = {
            active: true,
            timer: 0,
            cooldown: 0
        };
    }

    if (game.bookState.active) {
        game.bookState.timer += deltaTime;
        if (game.bookState.timer >= 5) {
            game.bookState.active = false;
            game.bookState.timer = 0;
            game.books = [];
            game.bookState.cooldown = 0;
        }
    } else {
        game.bookState.cooldown += deltaTime;
        if (game.bookState.cooldown >= 1) {
            game.bookState.active = true;
            game.bookState.cooldown = 0;
        }
    }

    if (!game.bookState.active) return;

    const desiredBookCount = game.playerUpgrades.books;
    while (game.books.length < desiredBookCount) {
        game.books.push({
            angle: game.books.length * (2 * Math.PI / desiredBookCount),
            lastHitTime: {}
        });
    }

    // Tek seferlik zaman önbelleği
    const booksUpdateTime = performance.now();

    game.books.forEach((book) => {
        const rotationSpeed = BOOK_CONFIG.baseSpeed * (1 + (game.playerUpgrades.books - 1) * 0.2);
        book.angle += rotationSpeed * deltaTime;

        const radius = BOOK_CONFIG.baseRadius;
        const x = game.player.x + Math.cos(book.angle) * radius;
        const y = game.player.y + Math.sin(book.angle) * radius;

        const hitEnemies = game.enemies.filter(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Orijinal satırı koruyoruz
            const currentTime = performance.now();
            // Sonradan ekleyerek tek seferlik değeri de kullanıyoruz
            const cachedTime = booksUpdateTime;

            return (
                (!book.lastHitTime[enemy.id] ||
                    currentTime - book.lastHitTime[enemy.id] > 100) &&
                distance < enemy.size / 2 + BOOK_CONFIG.baseSize / 2
            );
        });

        hitEnemies.forEach(enemy => {
            if (!enemy.velocity) {
                enemy.velocity = { x: 0, y: 0 };
            }

            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const damage = BOOK_CONFIG.baseDamage * game.playerUpgrades.books;
            showFloatingText(`-${damage}`, enemy.x, enemy.y, 'critical');
            enemy.health -= damage;

            const knockbackForce = 400;
            const knockbackAngle = Math.atan2(dy, dx);

            enemy.velocity.x = Math.cos(knockbackAngle) * knockbackForce;
            enemy.velocity.y = Math.sin(knockbackAngle) * knockbackForce;

            createDamageEffect(x, y);

            // Orijinal satır korunur
            book.lastHitTime[enemy.id] = performance.now();
            // Tekrar aynı değeri atayarak (kod silmeden) cache kullanalım
            book.lastHitTime[enemy.id] = booksUpdateTime;

            if (enemy.health <= 0) {
                handleEnemyHit(enemy);
                game.enemies = game.enemies.filter(e => e !== enemy);
            }
        });

        // Apply friction and update positions for all enemies
        game.enemies.forEach(enemy => {
            if (enemy.velocity) {
                const friction = 0.95;
                enemy.velocity.x *= friction;
                enemy.velocity.y *= friction;
                enemy.x += enemy.velocity.x * deltaTime;
                enemy.y += enemy.velocity.y * deltaTime;
            }
        });

        if (game.boss) {
            if (!game.boss.velocity) {
                game.boss.velocity = { x: 0, y: 0 };
            }

            const dx = game.boss.x - x;
            const dy = game.boss.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Orijinal satır korunur
            const currentTime = performance.now();
            // Cache ek satırı
            const cachedTime = booksUpdateTime;

            if (!book.lastHitTime.boss || currentTime - book.lastHitTime.boss > 500) {
                if (distance < game.boss.size / 2 + BOOK_CONFIG.baseSize / 2) {
                    const damage = BOOK_CONFIG.baseDamage * game.playerUpgrades.books;
                    game.boss.health -= damage;

                    const knockbackForce = 200;
                    const knockbackAngle = Math.atan2(dy, dx);

                    game.boss.velocity.x = Math.cos(knockbackAngle) * knockbackForce;
                    game.boss.velocity.y = Math.sin(knockbackAngle) * knockbackForce;

                    createDamageEffect(x, y);

                    // Orijinal satır
                    book.lastHitTime.boss = currentTime;
                    // Tekrardan cache
                    book.lastHitTime.boss = cachedTime;
                }
            }

            const bossFriction = 0.97;
            game.boss.velocity.x *= bossFriction;
            game.boss.velocity.y *= bossFriction;
            game.boss.x += game.boss.velocity.x * deltaTime;
            game.boss.y += game.boss.velocity.y * deltaTime;
        }
    });
}

function updateTime() {
    if (currentState !== GameState.PLAYING) return;
    const minutes = Math.floor(game.gameTime / 60);
    const seconds = Math.floor(game.gameTime % 60);
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function clearCanvas() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function updateObjects(deltaTime) {
    if (currentState === GameState.PLAYING) {
        if (isTouchDevice() && game.isMoving) {
            updatePlayerPosition(deltaTime);
        } else {
            updatePlayerPosition(deltaTime);
        }
        updateBullets(deltaTime);
        updatePickups();
        checkDoorCollision();
    }
}

function updateBullets(deltaTime) {
    game.bullets = game.bullets.filter(b => {
        if (!b.active) return false;

        const distanceFromPlayer = Math.sqrt(
            Math.pow(b.x - game.player.x, 2) + Math.pow(b.y - game.player.y, 2)
        );

        if (distanceFromPlayer > 800) { // Maximum travel distance
            bulletPool.release(b);
            return false;
        }

        b.x += b.dx * b.speed * deltaTime * 60;
        b.y += b.dy * b.speed * deltaTime * 60;
        b.lifetime -= deltaTime;

        if (b.lifetime <= 0 || b.pierceCount <= 0) {
            bulletPool.release(b);
            return false;
        }
        return true;
    });
}

function showFloatingText(text, x, y, style = 'normal') {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';

    if (style === 'critical') {
        floatingText.innerHTML = `<span class="damage-number">${text}</span>`;
    } else {
        floatingText.textContent = text;
    }

    switch (style) {
        case 'critical':
            floatingText.classList.add('critical');
            break;
    }

    document.body.appendChild(floatingText);

    // canvas konumunu tek seferde al
    const rect = canvas.getBoundingClientRect();
    const textX =
        rect.left + ((x - game.player.x) * game.camera.zoom + canvas.width / 2);
    const textY =
        rect.top + ((y - game.player.y) * game.camera.zoom + canvas.height / 2);

    floatingText.style.left = `${textX - floatingText.offsetWidth / 2}px`;
    floatingText.style.top = `${textY - floatingText.offsetHeight - 40}px`;

    // Animasyonu başlat
    requestAnimationFrame(() => {
        floatingText.classList.add('float-up-text');
    });

    // Animasyon bitiminde elementi kaldır
    setTimeout(() => {
        floatingText.remove();
    }, 1000); // 1 saniye sonra kaldır
}

function updateEnemies(deltaTime) {
    if (
        currentState !== GameState.PLAYING &&
        currentState !== GameState.INTRO &&
        currentState !== GameState.GAME_OVER
    )
        return;

    const MAX_DISTANCE = 450; // Maksimum uzaklık
    const TELEPORT_DISTANCE = 425; // Yeni spawn mesafesi

    const speedMultiplier = Math.min(
        2 + Math.log(game.score + 1) * ENEMY_SPEED_SCALE_FACTOR,
        ENEMY_SPEED_MULTIPLIER_MAX
    );
    const mobileSpeedBoost = isMobile ? 1 : 1;

    // Tek seferlik zaman hesaplaması
    const currentTime = performance.now();

    // Düşmanları batch'ler halinde işle
    // Bu sayede çok fazla düşman olduğunda tek karedeki işlem yükü azalır
    // *** BURADA BATCH_SIZE'ı artırarak performansı biraz yukarı çekebiliriz
    const BATCH_SIZE = 100; // Orijinal 20 idi, yükselttik

    const totalEnemies = game.enemies.length;
    for (let i = 0; i < totalEnemies; i += BATCH_SIZE) {
        const endIdx = Math.min(i + BATCH_SIZE, totalEnemies);
        const batch = game.enemies.slice(i, endIdx);

        batch.forEach(enemy => {
            // Temel hareket hesaplamaları
            const dx = game.player.x - enemy.x;
            const dy = game.player.y - enemy.y;
            const distanceSquared = dx * dx + dy * dy;
            const distance = Math.sqrt(distanceSquared);

            // Boss arena kontrolü
            if (game.bossArena && game.bossArena.active && game.boss) {
                const distanceToArenaCenter = Math.sqrt(
                    Math.pow(enemy.x - game.bossArena.x, 2) +
                    Math.pow(enemy.y - game.bossArena.y, 2)
                );

                // Eğer düşman arena dışındaysa ve içeri girmeye çalışıyorsa engelle
                if (distanceToArenaCenter > game.bossArena.radius) {
                    const towardsArena = Math.sqrt(
                        Math.pow(
                            game.bossArena.x - (enemy.x + dx),
                            2
                        ) + Math.pow(game.bossArena.y - (enemy.y + dy), 2)
                    );

                    if (towardsArena < distanceToArenaCenter) {
                        return; // Düşmanın hareketini engelle
                    }
                }
            }

            // Düşman çok uzakta mı kontrol et
            if (distance > MAX_DISTANCE) {
                // Oyuncunun hareket yönünü kullan
                let spawnAngle;
                if (game.player.moveDirection && (game.player.moveDirection.dx !== 0 || game.player.moveDirection.dy !== 0)) {
                    // Hareket yönünü kullan
                    spawnAngle = Math.atan2(game.player.moveDirection.dy, game.player.moveDirection.dx);
                } else {
                    // Hareket yoksa rastgele bir açı kullan
                    spawnAngle = Math.random() * Math.PI * 2;
                }

                // Rastgele sapma ekle (±45 derece)
                const randomOffset = (Math.random() - 0.5) * Math.PI * 0.5;
                const finalAngle = spawnAngle + randomOffset;

                const newX = game.player.x + Math.cos(finalAngle) * TELEPORT_DISTANCE;
                const newY = game.player.y + Math.sin(finalAngle) * TELEPORT_DISTANCE;

                // Düşmanı yeni pozisyona taşı
                enemy.x = newX;
                enemy.y = newY;

                // Teleport efekti ekle
                createTeleportEffect(enemy.x, enemy.y);
                return;
            }

            // Düşman tipine göre özel davranışlar
            switch (enemy.type) {
                case 'blinker':
                    if (currentTime - enemy.lastTeleportTime > enemy.teleportCooldown) {
                        const oldX = enemy.x;
                        const oldY = enemy.y;

                        // Blinker teleport yönünü de player'ın hareket yönüne göre ayarla
                        let teleportAngle;
                        if (game.player.moveDirection && (game.player.moveDirection.dx !== 0 || game.player.moveDirection.dy !== 0)) {
                            teleportAngle = Math.atan2(game.player.moveDirection.dy, game.player.moveDirection.dx);
                            // Rastgele sapma ekle (±90 derece)
                            teleportAngle += (Math.random() - 0.5) * Math.PI;
                        } else {
                            teleportAngle = Math.random() * Math.PI * 2;
                        }

                        enemy.x += Math.cos(teleportAngle) * enemy.teleportDistance;
                        enemy.y += Math.sin(teleportAngle) * enemy.teleportDistance;
                        enemy.lastTeleportTime = currentTime;

                        // Eski ve yeni konumda teleport efekti
                        createTeleportEffect(oldX, oldY);
                        createTeleportEffect(enemy.x, enemy.y);
                    }
                    break;

                case 'summoner':
                    if (currentTime - enemy.lastSummonTime > enemy.summonCooldown) {
                        const currentMinionCount = game.enemies.filter(e => e.isMinion).length;
                        const maxMinions = 3;

                        if (currentMinionCount < maxMinions) {
                            const summonCount = Math.min(1, maxMinions - currentMinionCount);

                            for (let i = 0; i < summonCount; i++) {
                                const minion = gameObjectPools.get('minion');
                                const angle = Math.random() * Math.PI * 2;
                                minion.x = enemy.x + Math.cos(angle) * enemy.summonRange;
                                minion.y = enemy.y + Math.sin(angle) * enemy.summonRange;
                                minion.active = true;
                                game.enemies.push(minion);
                            }
                            enemy.lastSummonTime = currentTime;
                        }
                    }
                    break;

                case 'shielder':
                    if (!enemy.shield && currentTime - enemy.lastShieldBreak > enemy.shieldRegenTime) {
                        enemy.shield = true;
                        enemy.shieldHealth = enemy.maxShieldHealth;
                    }
                    break;
            }

            // Hareket güncelleme
            if (distance > 0) {
                const invDistance = 1 / distance;
                const normalizedDx = dx * invDistance;
                const normalizedDy = dy * invDistance;

                const newX =
                    enemy.x +
                    normalizedDx *
                        enemy.speed *
                        speedMultiplier *
                        mobileSpeedBoost *
                        deltaTime *
                        60;
                const newY =
                    enemy.y +
                    normalizedDy *
                        enemy.speed *
                        speedMultiplier *
                        mobileSpeedBoost *
                        deltaTime *
                        60;

                // Boss arena kontrolü - yeni pozisyon için
                if (game.bossArena && game.bossArena.active && game.boss) {
                    const newDistanceToArena = Math.sqrt(
                        Math.pow(newX - game.bossArena.x, 2) +
                        Math.pow(newY - game.bossArena.y, 2)
                    );

                    const currentDistanceToArena = Math.sqrt(
                        Math.pow(enemy.x - game.bossArena.x, 2) +
                        Math.pow(enemy.y - game.bossArena.y, 2)
                    );

                    if (
                        currentDistanceToArena > game.bossArena.radius &&
                        newDistanceToArena < currentDistanceToArena
                    ) {
                        return;
                    }
                }

                enemy.x = newX;
                enemy.y = newY;
            } else {
                const randomAngle = Math.random() * Math.PI * 2;
                enemy.x +=
                    Math.cos(randomAngle) *
                    enemy.speed *
                    speedMultiplier *
                    mobileSpeedBoost *
                    deltaTime *
                    60;
                enemy.y +=
                    Math.sin(randomAngle) *
                    enemy.speed *
                    speedMultiplier *
                    mobileSpeedBoost *
                    deltaTime *
                    60;
            }
        });
    }

    // Intro ve Game Over durumlarında düşman sayısını sınırla
    if (
        (currentState === GameState.GAME_OVER || currentState === GameState.INTRO) &&
        game.enemies.length > 200
    ) {
        game.enemies.splice(0, game.enemies.length - 200);
    }
}

function showToast(message, x, y, callingFunction) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    const rect = canvas.getBoundingClientRect();
    let toastX, toastY;
    if (x !== undefined && y !== undefined) {
        toastX =
            rect.left + ((x - game.player.x) * game.camera.zoom + canvas.width / 2);
        toastY =
            rect.top + ((y - game.player.y) * game.camera.zoom + canvas.height / 2);
    } else {
        toastX = rect.left + canvas.width / 2;
        toastY = rect.top + canvas.height / 2;
    }
    toast.style.left = `${toastX - toast.offsetWidth / 2}px`;
    toast.style.top = `${toastY - toast.offsetHeight - TOAST_VERTICAL_OFFSET}px`;
    setTimeout(() => {
        toast.classList.add('float-up');
        setTimeout(() => toast.remove(), TOAST_ANIMATION_DURATION);
    }, 200);
}

function updateFrostbolts(deltaTime) {
    if (!game.activeFrostbolts) {
        game.activeFrostbolts = [];
        return;
    }

    const currentTime = performance.now();

    // Slow etkisini kaldırma
    if (game.slowedEnemies) {
        game.slowedEnemies.forEach((value, enemy) => {
            if (currentTime > value.endTime) {
                if (enemy === game.boss) {
                    game.boss.speed = game.boss.originalSpeed;
                } else {
                    enemy.speed = enemy.originalSpeed;
                }
                game.slowedEnemies.delete(enemy);
            }
        });
    }

    game.activeFrostbolts = game.activeFrostbolts.filter(frost => {
        if (!frost || !frost.active) return false;

        const distanceFromPlayer = Math.sqrt(
            Math.pow(frost.x - game.player.x, 2) + Math.pow(frost.y - game.player.y, 2)
        );

        if (distanceFromPlayer > 800) {
            return false;
        }

        if (frost.hasExploded) {
            frost.progress += deltaTime;
            return frost.progress < 0.5;
        }

        frost.x += frost.dx;
        frost.y += frost.dy;
        frost.rotation += frost.rotationSpeed;

        let hasCollided = false;

        // Boss collision check
        if (game.boss) {
            const dx = game.boss.x - frost.x;
            const dy = game.boss.y - frost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < game.boss.size / 2 + frost.radius) {
                hasCollided = true;
                game.boss.health -= frost.damage;
                showFloatingText(`-${frost.damage}❄️`, game.boss.x, game.boss.y, 'critical');

                if (!game.boss.originalSpeed) {
                    game.boss.originalSpeed = game.boss.speed;
                }
                game.boss.speed = game.boss.originalSpeed * (1 - frost.slowAmount);
                if (!game.slowedEnemies) {
                    game.slowedEnemies = new Map();
                }
                game.slowedEnemies.set(game.boss, {
                    endTime: currentTime + frost.freezeDuration
                });
            }
        }

        // Enemy collision check
        game.enemies.forEach(enemy => {
            const dx = enemy.x - frost.x;
            const dy = enemy.y - frost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size / 2 + frost.radius) {
                hasCollided = true;

                if (enemy.type === 'shielder' && enemy.shield) {
                    enemy.shieldHealth -= frost.damage;
                    showFloatingText(`-${frost.damage}❄️`, enemy.x, enemy.y, 'shield');

                    if (enemy.shieldHealth <= 0) {
                        enemy.shield = false;
                        enemy.lastShieldBreak = performance.now();
                        
                        // Check if enemy dies after shield break
                        if (enemy.health <= 0) {
                            handleEnemyHit(enemy);
                            game.enemies = game.enemies.filter(e => e !== enemy);
                        }
                    }
                } else {
                    enemy.health -= frost.damage;
                    showFloatingText(`-${frost.damage}❄️`, enemy.x, enemy.y, 'critical');

                    if (enemy.health <= 0) {
                        handleEnemyHit(enemy);
                        game.enemies = game.enemies.filter(e => e !== enemy);
                    } else {
                        if (!enemy.originalSpeed) {
                            enemy.originalSpeed = enemy.speed;
                        }
                        enemy.speed = enemy.originalSpeed * (1 - frost.slowAmount);
                        if (!game.slowedEnemies) {
                            game.slowedEnemies = new Map();
                        }
                        game.slowedEnemies.set(enemy, {
                            endTime: currentTime + frost.freezeDuration
                        });
                    }
                }
            }
        });

        if (hasCollided) {
            frost.hasExploded = true;
            createFrostExplosionEffect(frost.x, frost.y, frost.aoeRadius);
        }

        return true;
    });
}

function updateMouseDirection(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const angle = Math.atan2(dy, dx);
    game.player.direction = angle;
    game.isMoving = true;
}

function stopMovement() {
    game.isMoving = false;
}

function updateBloodDrops() {
    const fixedSpeed = 2;
    bloodDrops.forEach(drop => {
        drop.y += fixedSpeed + Math.random() * 2;
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
        }
    });
}

function updateVolume() {
    const volume = parseFloat(this.value) / 100;
    if (this.id === 'music-volume') {
        AudioSystem.setMusicVolume(volume);
    }
}
sfxVolumeSlider.addEventListener('input', updateVolume);

function showSettings() {
    if (currentState === GameState.PLAYING) {
        currentState = GameState.PAUSED;
    }
    settingsScreen.style.display = 'block';
    cheatUpgrades.innerHTML = '';
    const upgradeNames = {
        projectiles: 'Projectiles',
        speed: 'Speed',
        firerate: 'Fire Rate',
        pierce: 'Pierce',
        size: 'Projectile Size',
        range: 'Range',
    };
    const cheatScoreItem = document.createElement('div');
    cheatScoreItem.className = 'cheat-item';
    const span = document.createElement('span');
    span.textContent = '🏆 Score:';
    cheatScoreItem.appendChild(span);
    const cheatScoreInput = document.createElement('input');
    cheatScoreInput.type = 'number';
    cheatScoreInput.id = 'cheat-score';
    cheatScoreInput.value = game.score;
    cheatScoreInput.min = 0;
    cheatScoreItem.appendChild(cheatScoreInput);
    cheatScoreInput.addEventListener('change', () => {
        game.score = parseInt(cheatScoreInput.value, 10);
        scoreDisplay.textContent = game.score;
        document.body.classList.add('yellow-text');
    });
    cheatUpgrades.appendChild(cheatScoreItem);
    for (const [key, value] of Object.entries(game.playerUpgrades)) {
        const cheatItem = document.createElement('div');
        cheatItem.className = 'cheat-item';
        const span = document.createElement('span');
        span.textContent = `${upgradeEmojis[key]} ${upgradeNames[key]}:`;
        cheatItem.appendChild(span);
        const input = document.createElement('input');
        input.type = 'number';
        input.value = value;
        input.min = 1;
        input.max = 99;
        input.addEventListener('change', () => {
            game.playerUpgrades[key] = parseInt(input.value, 10);
            updateUpgradesList();
            document.body.classList.add('yellow-text');
            if (key === 'speed') {
                game.player.speed = game.defaultSpeed * game.playerUpgrades.speed;
            }
            if (key === 'firerate') {
                clearInterval(game.fireInterval);
                game.fireInterval = setInterval(shoot, 400 / game.playerUpgrades.firerate);
            }
        });
        cheatItem.appendChild(input);
        cheatUpgrades.appendChild(cheatItem);
    }
    const dropRateItem = document.createElement('div');
    dropRateItem.className = 'cheat-item';
    dropRateItem.innerHTML = `
        <label for="drop-rate">🎁 Drop Rate:</label>
        <input type="number" id="drop-rate" min="0" max="1" step="0.01" value="${PICKUP_DROP_RATE.toFixed(
            2
        )}">
    `;
    cheatUpgrades.appendChild(dropRateItem);
    const cheatBossItem = document.createElement('div');
    cheatBossItem.className = 'cheat-item';
    const spanBoss = document.createElement('span');
    spanBoss.textContent = '👾 Spawn Boss:';
    cheatBossItem.appendChild(spanBoss);
    const bossButton = document.createElement('button');
    bossButton.textContent = '🧛‍♂️';
    bossButton.className = 'button';
    bossButton.style.width = '60px';
    bossButton.style.height = '30px';
    bossButton.style.padding = '0';
    bossButton.style.lineHeight = '30px';
    bossButton.onclick = () => {
        spawnBossCheat();
        document.body.classList.add('yellow-text');
    };
    cheatBossItem.appendChild(bossButton);
    cheatUpgrades.appendChild(cheatBossItem);
    const dropRateInput = document.getElementById('drop-rate');
    dropRateInput.addEventListener('input', () => {
        PICKUP_DROP_RATE = parseFloat(dropRateInput.value);
        document.body.classList.add('yellow-text');
    });
    if (game.player.invulnerable) {
        document.body.classList.add('hurt');
        game.remainingInvulnerabilityTime = game.invulnerabilityEndTime - performance.now();
    }
}

function hideSettings() {
    settingsScreen.style.display = 'none';
    if (currentState === GameState.INTRO || currentState === GameState.UPGRADING) {
        return;
    }
    if (currentState === GameState.PAUSED) {
        currentState = GameState.PLAYING;
    }
    if (game.player.invulnerable) {
        document.body.classList.add('hurt');
        game.invulnerabilityEndTime = performance.now() + game.remainingInvulnerabilityTime;
    }
}

function checkScoreThresholds(currentScore) {
    const thresholds = [30, 100, 300];
    
    if (thresholds.includes(currentScore)) {
        showToast("🧛 Vampires Coming!", game.player.x, game.player.y);
        
        // Temporarily increase max enemies
        setTemporaryMaxEnemies();
        
        // Calculate spawn angle based on player direction
        const spawnAngle = game.player.direction || 0;
        const arcAngle = Math.PI; // 180 degrees arc
        const enemyCount = 10;
        
        // Spawn enemies in an arc formation
        for (let i = 0; i < enemyCount; i++) {
            const angleOffset = (arcAngle / (enemyCount - 1)) * i - arcAngle / 2;
            const angle = spawnAngle + angleOffset;
            
            // Calculate spawn position (at a distance from player)
            const spawnDistance = 600;
            const spawnX = game.player.x + Math.cos(angle) * spawnDistance;
            const spawnY = game.player.y + Math.sin(angle) * spawnDistance;
            
            // Create enemy with random type
            const enemyTypes = ['normal', 'fast', 'tank'];
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            const enemy = {
                x: spawnX,
                y: spawnY,
                health: 2,
                size: 30,
                speed: 0.3,
                damage: 1,
                type: randomType,
                active: true
            };
            
            game.enemies.push(enemy);
        }
        
        // Play sound effect
        playSound('enemySpawn', 1, 0);
    }
}
