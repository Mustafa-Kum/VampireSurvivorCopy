function calculateScoreRequirement(level) {
    if (level === 0) return 15;  // İlk level için 15 (was 25)
    if (level === 1) return 35; // İkinci level için 35 (was 60)

    let previousDiff = 25;  // İlk iki level arası fark (was 40)
    let currentRequired = 35;  // İkinci leveldeki gereksinim (was 60)

    for (let i = 2; i <= level; i++) {
        previousDiff += 5;  // Her level'da 5 daha fazla artış (was 8)
        currentRequired += previousDiff;
    }

    return currentRequired;
}

function interpolateColor(color, flashColor, intensity) {
    let baseRGB;
    if (Array.isArray(color)) {
        baseRGB = color;
    } else if (typeof color === 'string') {
        if (color.startsWith('hsl')) {
            baseRGB = parseHSL(color);
        } else {
            // Tek seferde 16'lık sayı olarak alıp bit kaydırma ile RGB ayrıştırma
            const intColor = parseInt(color.slice(1), 16);
            baseRGB = [
                (intColor >> 16) & 255,
                (intColor >> 8) & 255,
                intColor & 255
            ];
        }
    } else {
        throw new Error('Invalid color format');
    }

    let targetRGB;
    if (Array.isArray(flashColor)) {
        targetRGB = flashColor;
    } else if (typeof flashColor === 'string') {
        if (flashColor.startsWith('hsl')) {
            targetRGB = parseHSL(flashColor);
        } else {
            const intFlashColor = parseInt(flashColor.slice(1), 16);
            targetRGB = [
                (intFlashColor >> 16) & 255,
                (intFlashColor >> 8) & 255,
                intFlashColor & 255
            ];
        }
    } else {
        targetRGB = [255, 255, 255]; // Default flash color (white)
    }

    // Ensure baseRGB and targetRGB are valid
    if (!baseRGB || !Array.isArray(baseRGB) || baseRGB.length !== 3) {
        baseRGB = [0, 0, 0];
    }
    if (!targetRGB || !Array.isArray(targetRGB) || targetRGB.length !== 3) {
        targetRGB = [255, 255, 255];
    }

    // Renkler arasında lineer interpolasyon
    const r = baseRGB[0] + (targetRGB[0] - baseRGB[0]) * intensity;
    const g = baseRGB[1] + (targetRGB[1] - baseRGB[1]) * intensity;
    const b = baseRGB[2] + (targetRGB[2] - baseRGB[2]) * intensity;

    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function parseHSL(hslStr) {
    const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
        return hslToRgb(match[1] / 360, match[2] / 100, match[3] / 100);
    }
    return null;
}

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
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

function rgbToString(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function lerpRotation(targetAngle, factor) {
    if (!game.player.direction) {
        game.player.direction = targetAngle;
    }

    let diff = targetAngle - game.player.direction;

    // En kısa rotasyon yolunu bul
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    // Yumuşak dönüş uygula
    game.player.direction += diff * Math.min(factor, 1);
}

function getRandomBrightColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 40) + 60; // 60-100 arası
    const lightness = Math.floor(Math.random() * 30) + 40; // 40-70 arası
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function generateRandomColor() {
    // Parlak renkler için HSL renk uzayında renk üret
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 20) + 80; // 80-100 arası
    const lightness = Math.floor(Math.random() * 20) + 60;  // 60-80 arası

    // HSL'den Hex'e dönüşüm fonksiyonu
    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `${f(0)}${f(8)}${f(4)}`;
    }

    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `${f(0)}${f(8)}${f(4)}`;
}
