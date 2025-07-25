// Karakter tipleri için sabitler
const CHARACTER_TYPES = {
    WARRIOR: 'warrior',
    WIZARD: 'wizard',
    ARCHER: 'archer'
};

let enemySpeed = 0.3;

// Initialize Poki SDK
let PokiSDK;
if (typeof window !== 'undefined' && window.PokiSDK) {
    PokiSDK = window.PokiSDK;
}

// Safe call wrapper for Poki SDK
function safePokiSDKCall(method, ...args) {
    if (typeof PokiSDK === 'undefined') {
        return Promise.resolve();
    }
    return PokiSDK[method](...args);
}

const GameState = {
  LOADING: 'loading',
  INTRO: 'intro',
  PLAYING: 'playing',
  PAUSED: 'paused',
  UPGRADING: 'upgrading',
  GAME_OVER: 'gameOver'
};

let animationFrameId;
let currentState = GameState.LOADING;
let originalGroundPattern;
const assets = {
  images: {
    groundPattern:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\
<rect width="100" height="100" fill="%237f6e89"/>\
<rect x="1" y="1" width="100" height="100" rx="0" \
fill="%23c4acd4" stroke="%23000000" stroke-width="1" opacity="1"/>\
<circle cx="10" cy="10" r="2" fill="%23ffffff" opacity="0.4"/>\
<circle cx="90" cy="10" r="2" fill="%23ffffff" opacity="0.4"/>\
<circle cx="10" cy="90" r="2" fill="%23ffffff" opacity="0.4"/>\
<circle cx="90" cy="90" r="2" fill="%23ffffff" opacity="0.4"/></svg>',
    victoryPattern:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\
<rect width="100" height="100" fill="%237fbf7f"/>\
<rect x="1.5" y="1.5" width="97" height="97" rx="0" \
fill="%23a0e0a0" stroke="%23050505" stroke-width="1" opacity="0.5"/>\
<circle cx="10" cy="10" r="3" fill="%23ffffff" opacity="0.4"/>\
<circle cx="90" cy="10" r="3" fill="%23ffffff" opacity="0.4"/>\
<circle cx="10" cy="90" r="3" fill="%23ffffff" opacity="0.4"/>\
<circle cx="90" cy="90" r="3" fill="%23ffffff" opacity="0.4"/>\
<text x="50" y="55" font-size="20" text-anchor="middle" fill="%23ffffff" opacity="0.6">2</text>\
</svg>'
  },
  audio: {
    backgroundMusic: 'assets/audio/BackgroundVampire.mp3'
  }
};

let loadedAssets = { 
  images: {},
  audio: {}
};
let lastTime = performance.now();
let lastFrameTime = performance.now();
let fpsDisplayEnabled = false;
let fpsValue;

const BOOK_CONFIG = {
  baseRadius: 80,      // Dönme yarıçapı
  baseSpeed: 2,        // Dönme hızı
  baseDamage: 0.2,     // Temel hasar
  baseSize: 20,        // Kitap boyutu
  bookSpacing: 2 * Math.PI // Kitaplar arası açı
};

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('time');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const introScreen = document.getElementById('intro-screen');
const settingsScreen = document.getElementById('settings-screen');
const upgradeScreen = document.getElementById('upgrade-screen');
const finalScoreDisplay = document.getElementById('final-score');
const upgradeSummary = document.getElementById('upgrade-summary');

document.getElementById('restart-btn').addEventListener('click', () => {
  safePokiSDKCall('commercialBreak').then(() => {
    startGame();
  });
});

const settingsGear = document.getElementById('settings-gear');
const uiOverlay = document.getElementById('ui-overlay');
const musicVolumeSlider = document.getElementById('music-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const upgradeList = document.getElementById('upgrades-list');
const cheatUpgrades = document.getElementById('cheat-upgrades');
const immortalityCheckbox = document.getElementById('immortality');
const loadingScreen = document.getElementById('loading-screen');

let TOAST_ANIMATION_DURATION = 1500;
let TOAST_VERTICAL_OFFSET = 20;
let PLAYER_MAX_HEALTH = 20;
let PLAYER_FIRE_INTERVAL = 600;
let PICKUP_DROP_RATE = 0.01;
let PICKUP_HEAL = 0;
let PICKUP_UPGRADES = {
  projectiles: { value: 1, multiplier: false, enabled: true, weight: 2 },
  firerate: { value: 0.05, multiplier: true, enabled: true, weight: 1 },
  pierce: { value: 1, multiplier: false, enabled: true, weight: 2 },
  chainLightning: { value: 1, multiplier: false, enabled: true, weight: 2 },
  fireball: { value: 1, multiplier: false, enabled: true, weight: 2 },
  frostbolt: { value: 1, multiplier: false, enabled: true, weight: 2 },
  books: { value: 1, multiplier: false, enabled: true, weight: 2 }
};

let BOSS_MAX_HEALTH = 100;
let BOSS_DAMAGE = 1;
let BOSS_SPEED = 0.7;
let BOSS_SCORE_BONUS = 20;
let ENEMY_SIZE = 30;
let ENEMY_DAMAGE = 0.5;
let ENEMY_BASE_NUM = 5;
let ENEMY_SPAWN_QUANTITY = 1.2;
let ENEMY_SPAWN_STAGGER_DELAY = 1000;
let ENEMY_SPAWN_OFFSET = 100;
let ENEMY_SPEED_MULTIPLIER_MAX = 2.0;
let ENEMY_SPEED_SCALE_FACTOR = 0.3;
let keys;

function getPlayerMaxHealth() {
  return PLAYER_MAX_HEALTH;
}

let fpsValues;
let game = {
  player: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: canvas.width * 0.001,
    direction: null,
    health: getPlayerMaxHealth(),
    invulnerable: false,
    coins: 0,
    characterType: 'warrior'
  },
  door: null,
  doorArrow: {
    visible: false,
    rotation: 0
  },
  chainLightningCooldown: 20000,
  chainLightningInterval: 2000,
  lastTime: performance.now(),
  frozenTime: null,
  enemies: [],
  enemySpeedMultiplier: 1,
  bullets: [],
  pickups: [],
  score: 0,
  level: 0,
  gameTime: 0,
  highScore: 0,
  recordTime: 0,
  bossesKilled: 0,
  camera: { x: 0, y: 0, zoom: 0.35 },
  isMouseDown: false,
  targetX: 0,
  targetY: 0,
  lastScoreUpgrade: 0,
  playerUpgrades: {
    projectiles: 1,
    speed: 0,
    firerate: 1,
    pierce: 1,
    size: 1,
    range: 1,
    chainLightning: 1
  },
  AUTOPRAY: false,
  boss: null,
  pickupsEaten: 0,
  defaultSpeed: canvas.width * 0.003,
  lastBossSpawnScore: 0,
  nextEnemySpawnTime: 0,
  fireInterval: null,
  invulnerabilityEndTime: 0,
  remainingInvulnerabilityTime: 0,
  books: []
};

const upgradeEmojis = {
  projectiles: '🎯',
  speed: '🏃',
  firerate: '💥',
  pierce: '🗡️',
  size: '💪',
  range: '🔭',
  chainLightning: '⚡',
  fireball: '🔥',
  frostbolt: '❄️',
  books: '📚'
};

// Örnek: createDeathParticles fonksiyonu, patlama efekti, çekirdek, plazma halkaları, spiral kollar, enerji parçacıkları, parlama efektleri vb. güncelleme fonksiyonları buraya eklenmeli.

let activeLightnings = [];
let sparkParticles = [];

// RGB rengi CSS string'ine çeviren yardımcı fonksiyon (uygulama detayları verilmemiş)

// Toplanabilir nesnelerin hareket eden dalga efekti için stil (pickup-wave)
const pickupWaveStyle = document.createElement('style');
pickupWaveStyle.textContent = `
.pickup-wave {
  position: fixed;
  pointer-events: none;
  width: 60px;
  height: 60px;
  border: 4px solid #FFD700;
  border-radius: 50%;
  animation: waveAnim 1s forwards;
  z-index: 1000;
}
@keyframes waveAnim {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  50% { opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}
`;
document.head.appendChild(pickupWaveStyle);

// Game objesine yeni özellikler ekleyelim
game.playerUpgrades.books = 1; // Dönen kitap sayısı

// Kitapları güncelle ve çiz (orbiting books) fonksiyonları buraya eklenmeli

// Hasar efekti, yumuşak dönüş için yardımcı fonksiyonlar vb.

// Zoom ayarları
let zoomSpeed = 0.05;
let targetZoom = 0.8;

// Teleport efekti için yardımcı fonksiyon

let lastWave = 1; // İlk dalga numarasını tanımla

// Helper function to create combined wave key (detaylar kodda yer almalı)

// Wave bilgisini gösteren fonksiyon (detaylar kodda yer almalı)

const medalStyles = document.createElement('style');
medalStyles.textContent = `
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
  text-align: center;
  min-width: 300px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}
.medal-icon {
  font-size: 60px;
  margin-bottom: 10px;
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
  0% { opacity: 1; }
  100% { opacity: 0; }
}
.bronze .medal-icon { text-shadow: 0 0 10px #CD7F32; }
.silver .medal-icon { text-shadow: 0 0 10px #C0C0C0; }
.gold .medal-icon { text-shadow: 0 0 10px #FFD700; }
`;
document.head.appendChild(medalStyles);

const EARLY_GAME_UPGRADES = ['chainLightning', 'fireball', 'books'];

let joystickActive = false;
let joystickBase = null;
let joystickKnob = null;
let startX = 0;
let startY = 0;
let baseX = 0;
let baseY = 0;

// Kapı çizim fonksiyonu - drawObjects içerisine eklenmeli
// Kapı collision kontrolü, pattern numarasını takip etmek için:
let currentPatternNumber = 1;

// Portal efekti kodları buraya eklenmeli

const bloodDrops = [];

// Parıldama (sparkle) efekti için stil
const sparkleStyle = document.createElement('style');
sparkleStyle.textContent = `
.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  pointer-events: none;
  animation: sparkleAnim 1s forwards;
  z-index: 1000;
  transform: translate(-50%, -50%);
}
@keyframes sparkleAnim {
  0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.5) rotate(180deg); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(0) rotate(360deg); opacity: 0; }
}
`;
document.head.appendChild(sparkleStyle);

const healthSlider = document.getElementById('health');
healthSlider.addEventListener('input', () => {
  game.player.health = parseInt(healthSlider.value);
  document.body.classList.add('yellow-text');
  if (game.player.health === 0) {
    gameOver();
    playSound('death', 1, 0);
  }
});

const pickupStyle = document.createElement('style');
pickupStyle.textContent = `
.pickup-wave {
  position: absolute;
  pointer-events: none;
  width: 60px;
  height: 60px;
  border: 4px solid #FFD700;
  border-radius: 50%;
  animation: waveAnim 1s forwards;
  z-index: 1000;
}
@keyframes waveAnim {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  50% { opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}
`;
document.head.appendChild(pickupStyle);

musicVolumeSlider.addEventListener('input', (e) => {
  const volume = parseFloat(e.target.value) / 100;
  if (AudioSystem.musicGainNode) {
    AudioSystem.musicGainNode.gain.value = volume;
  }
});

immortalityCheckbox.addEventListener('change', () => {
  document.body.classList.add('yellow-text');
});

const medalRequirements = {
  kills: {
    bronze: { requirement: 75, icon: '🥉', title: 'Bronze Hunter', description: 'Defeat 75 enemies' },
    silver: { requirement: 175, icon: '🥈', title: 'Silver Slayer', description: 'Defeat 175 enemies' },
    gold: { requirement: 275, icon: '🥇', title: 'Golden Warrior', description: 'Defeat 275 enemies' }
  },
  boss: {
    bronze: { requirement: 1, icon: '🥉', title: 'Boss Hunter', description: 'Kill 1 boss' },
    silver: { requirement: 3, icon: '🥈', title: 'Boss Slayer', description: 'Kill 3 boss' },
    gold: { requirement: 5, icon: '🥇', title: 'Boss Master', description: 'Kill 5 boss' }
  },
  survival: {
    bronze: { requirement: 60, icon: '🥉', title: 'Survivor', description: 'Stay alive 1 minute' },
    silver: { requirement: 120, icon: '🥈', title: 'Legend', description: 'Stay alive 2 minute' },
    gold: { requirement: 180, icon: '🥇', title: 'Master', description: 'Stay alive 3 minute' }
  }
};

const style = document.createElement('style');
style.textContent = `
#upgrade-screen {
  background: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  min-width: 320px;
}
#upgrade-screen h2 {
  color: #FFD700;
  font-size: 24px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}
#upgrade-cards-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px;
}
.upgrade-card {
  background: linear-gradient(145deg, rgba(50, 50, 50, 0.9), rgba(30, 30, 30, 0.9));
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  width: 180px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.upgrade-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}
.upgrade-card:hover .upgrade-icon {
  transform: scale(1.1);
}
.upgrade-icon {
  font-size: 40px;
  margin-bottom: 10px;
  transition: transform 0.3s ease;
}
.upgrade-title {
  color: #FFD700;
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: bold;
}
.upgrade-description {
  color: #CCCCCC;
  font-size: 12px;
  margin-bottom: 30px;
  min-height: 60px;
}
.upgrade-stats {
  color: #88FF88;
  font-size: 10px;
  text-align: left;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  margin-top: 10px;
  position: relative;
  top: -9%;
  text-align: center;
}
.upgrade-type {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 12px;
  color: #888;
}
.upgrade-card.damage {
  border-color: rgba(255, 100, 100, 0.3);
}
.upgrade-card.utility {
  border-color: rgba(100, 100, 255, 0.3);
}
.upgrade-card.special {
  border-color: rgba(255, 215, 0, 0.3);
}
.upgrade-level {
  position: absolute;
  bottom: 12px;
  right: 35%;
  color: #888;
  font-size: 12px;
  scale: 2;
}
@keyframes cardGlow {
  0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
}
.upgrade-card:hover {
  animation: cardGlow 2s infinite;
}
`;
document.head.appendChild(style);

const AURA_BASE_RADIUS = 100;
const AURA_DAMAGE_INTERVAL = 500;
const AURA_BASE_DAMAGE = 1;

// Burn effect constants
const BURN_DURATION = 3000; // 3 seconds in milliseconds
const BURN_DAMAGE_INTERVAL = 500; // Damage every 0.5 seconds
const BURN_BASE_DAMAGE = 1; // Base damage per tick

// Fog of War constants
const FOG_OF_WAR = {
    VISIBLE_RADIUS: 300,  // Player'ın görebildiği alan yarıçapı
    TRANSITION_RADIUS: 100,  // Görünür alandan karanlığa geçiş mesafesi
    COLOR: 'rgba(0, 0, 0, 0.85)'  // Fog rengi
};

// Fog Event sabitleri
const FOG_EVENT = {
    TRIGGER_SCORE: 35,    // Event'in başlayacağı skor
    DURATION: 30000,      // Event süresi (30 saniye)
    ACTIVE: false,        // Event'in aktif olup olmadığı
    START_TIME: null,     // Event'in başlama zamanı
    WARNING_TIME: 5000,   // Bitiş uyarısı için kalan süre (5 saniye)
    FADE_DURATION: 2000,  // Fade in/out süresi (2 saniye)
    HAS_TRIGGERED: false  // Event'in daha önce tetiklenip tetiklenmediği
};

// Add coin reward calculation
function calculateCoinReward(level) {
    // Base reward starts at 5 coins
    const baseReward = 5;
    
    // Additional coins per level (increases with level)
    const levelBonus = Math.floor(level * 2);
    
    // Total reward
    return baseReward + levelBonus;
}
