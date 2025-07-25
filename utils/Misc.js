function safePokiSDKCall(method, ...args) {
    // PokiSDK tanımlı değilse boş bir Promise dön
    if (typeof PokiSDK === 'undefined') {
        return Promise.resolve();
    }
    // rewardedBreak kontrolü
    if (method === 'rewardedBreak') {
        return PokiSDK.rewardedBreak(...args);
    }
    // Diğer durumlar için direkt çağrı
    return PokiSDK[method](...args);
}

function findNextChainTargetInRange(currentTarget, hitEnemies, range) {
    let nearestDistance = Infinity;
    let nearestEnemy = null;
    
    // Sık kullanılan değerleri lokal değişkenlerde tutarak (özellikle döngü içinde)
    // erişimi hızlandırıyoruz
    const rangeSq = range * range;            // Kare mesafesi
    const cTx = currentTarget.x;
    const cTy = currentTarget.y;

    game.enemies.forEach(enemy => {
        if (hitEnemies.has(enemy)) return;

        // Math.sqrt yerine kare mesafesi hesaplıyoruz
        const dx = enemy.x - cTx;
        const dy = enemy.y - cTy;
        const distanceSq = dx * dx + dy * dy;

        // Hem menzil kontrolü hem de en yakın düşman belirleme
        if (distanceSq <= rangeSq && distanceSq < nearestDistance) {
            nearestDistance = distanceSq;
            nearestEnemy = enemy;
        }
    });

    return nearestEnemy;
}

function dropLootChest(x, y) {
    // Görev: Ganimet sandığı oluşturma
    const chest = {
        x: x,
        y: y,
        width: 30,
        height: 25,
        collected: false,
        spawnTime: performance.now()
    };

    game.lootChest = chest;

    // Chest spawn efekti
    createSparkles(x, y, '#FFD700', 12);
}

function createBloodDrops(count) {
    // canvas.width ve canvas.height değerlerini önceden değişkende tutarak
    // her tur canvas.width gibi global nesneye erişimi azaltmak
    const { width, height } = canvas;

    for (let i = 0; i < count; i++) {
        const drop = gameObjectPools.get('bloodDrop');
        drop.x = Math.random() * width;
        drop.y = -Math.random() * height - 20;
        drop.speed = 2 + Math.random() * 2;
        drop.length = 10 + Math.random() * 10;
        drop.active = true;
        bloodDrops.push(drop);
    }
}
